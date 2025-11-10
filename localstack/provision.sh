#!/bin/sh

set -e

ENDPOINT=http://localhost:4566
REGION=eu-west-2

aws --endpoint-url=${ENDPOINT} kms create-key \
    --region ${REGION} \
    --key-usage SIGN_VERIFY \
    --key-spec ECC_NIST_P256 \
    --tags '[{"TagKey":"_custom_key_material_","TagValue":"MHcCAQEEIKexbdPE2TDYzOuasfwN4QWNqHF1wNsV30ERMPPaRYnWoAoGCCqGSM49AwEHoUQDQgAE+NKi4QpYV/avqTFFoldRIYEZaRgKF/qv+xJsek63Eh2cKn922zlJHj2KglzSlLm439BfFYGDYVet6W7pkvIYfg=="},{"TagKey":"_custom_id_","TagValue":"fe960654-cdc9-4580-9368-8c58c3865a46"}]'

aws --endpoint-url=${ENDPOINT} kms create-alias \
    --region ${REGION} \
    --alias-name alias/localSigningKeyAlias \
    --target-key-id fe960654-cdc9-4580-9368-8c58c3865a46

aws --endpoint-url=${ENDPOINT} s3api create-bucket --bucket jwks --create-bucket-configuration LocationConstraint=${REGION}

aws --endpoint-url=${ENDPOINT} s3api create-bucket --bucket status-list --create-bucket-configuration LocationConstraint=${REGION}