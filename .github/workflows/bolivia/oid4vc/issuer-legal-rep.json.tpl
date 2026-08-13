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
      "id": "bolivia-legal-rep",
      "format": "dc+sd-jwt",
      "vct": "https://seprec.bolivia.playground.__NETWORK__.verana.network/oid4vc/vct/bolivia-legal-rep",
      "name": "LegalRepresentative",
      "description": "Proof of legal representation issued by the SEPREC (demo) of the Estado Plurinacional de Bolivia (demo)",
      "vtjscId": "https://seprec.bolivia.playground.__NETWORK__.verana.network/vt/schemas-legal-representative-jsc.json",
      "claims": [
        "companyName",
        "companyRegistryId",
        "representativeName",
        "role",
        "powers",
        "validUntil"
      ],
      "disclosureFrame": [
        "companyName",
        "companyRegistryId",
        "representativeName",
        "role",
        "powers",
        "validUntil"
      ],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": []
}
