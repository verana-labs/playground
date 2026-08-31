{
  "issuer": {
    "id": "demo-did",
    "displayName": "__SERVICE_NAME__",
    "metadataSigner": "did",
    "signing": {
      "development": {
        "enabled": true,
        "commonName": "__SERVICE_NAME__"
      }
    },
    "keyAttestationCertificates": [
      "MIIC0zCCAnmgAwIBAgIUXRXxkLbUM6+njr/XT0IIw/HA/uowCgYIKoZIzj0EAwMwVzEZMBcGA1UEAwwQUElEIElzc3VlciBDQSAwMjEtMCsGA1UECgwkRVVESSBXYWxsZXQgUmVmZXJlbmNlIEltcGxlbWVudGF0aW9uMQswCQYDVQQGEwJFVTAeFw0yNTA0MDkwMDAzMzBaFw0zNDA3MDYwMDAzMjlaMFcxGTAXBgNVBAMMEFBJRCBJc3N1ZXIgQ0EgMDIxLTArBgNVBAoMJEVVREkgV2FsbGV0IFJlZmVyZW5jZSBJbXBsZW1lbnRhdGlvbjELMAkGA1UEBhMCRVUwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARkqdLmwIlv+SSWr00tAIrt7EAMztgd3w9qA6qEm16yVfsLcyx2f4oIWuH45wa37J9GoNWpdeo27VoSoNMCzxOYo4IBITCCAR0wEgYDVR0TAQH/BAgwBgEB/wIBADAfBgNVHSMEGDAWgBRCUFC+ELgQ8J1EXI2/qxAI7ifcSTATBgNVHSUEDDAKBggrgQICAAABBzBDBgNVHR8EPDA6MDigNqA0hjJodHRwczovL3ByZXByb2QucGtpLmV1ZGl3LmRldi9jcmwvcGlkX0NBX0VVXzAyLmNybDAdBgNVHQ4EFgQUQlBQvhC4EPCdRFyNv6sQCO4n3EkwDgYDVR0PAQH/BAQDAgEGMF0GA1UdEgRWMFSGUmh0dHBzOi8vZ2l0aHViLmNvbS9ldS1kaWdpdGFsLWlkZW50aXR5LXdhbGxldC9hcmNoaXRlY3R1cmUtYW5kLXJlZmVyZW5jZS1mcmFtZXdvcmswCgYIKoZIzj0EAwMDSAAwRQIhAIavYfC5o0VVLKfgTKkzzWgc09hzDMsCl3O2le2sQfG7AiA2soqAN5gtUOLQKWK00DUz22EW79rvaV+VJPvfdQeokA=="
    ]
  },
  "credentialConfigurations": [
    {
      "id": "bhi-right-to-work",
      "format": "dc+sd-jwt",
      "vct": "https://northbank.bhi.playground.__NETWORK__.verana.network/oid4vc/vct/bhi-right-to-work",
      "name": "RightToWork",
      "description": "UK right-to-work status established by a certified DVS provider (demo)",
      "vtjscId": "https://northbank.bhi.playground.__NETWORK__.verana.network/vt/schemas-right-to-work-jsc.json",
      "claims": [
        "firstName",
        "surname",
        "birthDate",
        "portrait",
        "nationality",
        "rtwEstablishedDate",
        "rtwExpiryDate"
      ],
      "disclosureFrame": [
        "firstName",
        "surname",
        "birthDate",
        "portrait",
        "nationality",
        "rtwEstablishedDate",
        "rtwExpiryDate"
      ],
      "ttlSeconds": 2592000
    },
    {
      "id": "bhi-employment",
      "format": "dc+sd-jwt",
      "vct": "https://northbank.bhi.playground.__NETWORK__.verana.network/oid4vc/vct/bhi-employment",
      "name": "Employment",
      "description": "One employment relationship, from HMRC payroll records under the DUAA 2025 gateway (demo)",
      "vtjscId": "https://northbank.bhi.playground.__NETWORK__.verana.network/vt/schemas-employment-jsc.json",
      "claims": [
        "employer",
        "startDate",
        "endDate"
      ],
      "disclosureFrame": [
        "employer",
        "startDate",
        "endDate"
      ],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": []
}
