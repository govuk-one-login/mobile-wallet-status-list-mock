// Build and run the mock
`npm run build`
`npm run dev` 

// Run the prism proxy
`npm run prism-proxy`

// call the prism proxy

// success
```
❯ curl -i -X POST http://127.0.0.1:4010/issue -d '{}' -H "Content-Type: application/jwt"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: *
server: Werkzeug/3.1.4 Python/3.11.10
date: Thu, 12 Feb 2026 14:08:07 GMT
content-type: application/json
Content-Length: 79
Connection: keep-alive
Keep-Alive: timeout=5

{"idx":5,"uri":"https://localhost:3000/t/2b88d6bc-ff45-43a8-9e84-fad8aa996944"}
```

// failure
```
❯ curl -i -X POST http://127.0.0.1:4010/issue -d '{}' -H "Content-Type: application/json"
```

```
HTTP/1.1 422 Unprocessable Entity
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: *
content-type: application/problem+json
Content-Length: 339
Date: Thu, 12 Feb 2026 14:09:02 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"type":"https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY","title":"Invalid request","status":422,"detail":"Your request is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.","validation":[{"severity":"Error","code":415,"message":"Supported content types: application/jwt"}]}% 
```