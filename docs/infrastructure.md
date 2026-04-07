# Mock Status List Infrastructure

This service is a serverless mock of a credential status list, deployed to AWS (eu-west-2) via AWS SAM. 

All compute runs inside a VPC on private subnets. KMS holds the signing key; the private key material never leaves KMS. 
S3 holds the status list JWTs and the JWKS — two of the four API routes read from S3 directly without invoking Lambda.

```mermaid
flowchart LR
    client(["Client"])

    subgraph aws ["AWS — eu-west-2"]
        r53["Route53 A record"]

        subgraph apigw ["API Gateway (Regional)"]
            ep1["POST /issue"]
            ep2["POST /revoke"]
            ep3["GET /t/{statusList}"]
            ep4["GET /.well-known/jwks.json"]
        end

        subgraph vpc ["VPC — Private Subnets"]
            issueF["IssueFunction\n(Node 22)"]
            revokeF["RevokeFunction\n(Node 22)"]
            jwksF["JwksFunction\n(Node 22)"]
        end

        kms[("KMS\nECC P-256\nES256")]

        subgraph s3 ["S3"]
            statusBucket[("StatusListBucket")]
            jwksBucket[("JwksBucket")]
        end
    end

    client --> r53
    r53 --> apigw

    ep1 -->|Lambda proxy| issueF
    ep2 -->|Lambda proxy| revokeF
    ep3 -->|Direct S3 integration| statusBucket
    ep4 -->|Direct S3 integration| jwksBucket

    issueF -->|kms:Sign| kms
    issueF -->|s3:PutObject| statusBucket

    revokeF -->|kms:Sign| kms
    revokeF -->|s3:PutObject\ns3:GetObject| statusBucket

    jwksF -->|kms:GetPublicKey| kms
    jwksF -->|s3:PutObject| jwksBucket
```

> **Note:** JwksFunction runs once at startup (not triggered by API Gateway) to populate the JWKS bucket.
> The two direct S3 integrations (defined in `openApiSpec/mock/api-spec.yaml`) bypass Lambda entirely — API Gateway reads from S3 directly.