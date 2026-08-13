{
  "verifier": {
    "id": "demo",
    "displayName": "__SERVICE_NAME__",
    "signing": {
      "development": {
        "enabled": true,
        "commonName": "__SERVICE_NAME__"
      }
    }
  },
  "trust": {
    "resolverUrl": "https://resolver.__NETWORK__.verana.network/v1/trust",
    "timeoutMs": 10000,
    "allowedDidWebHosts": [
      "segip.bolivia.playground.__NETWORK__.verana.network",
      "seprec.bolivia.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "cedula-digital",
      "format": "dc+sd-jwt",
      "vct": "https://segip.bolivia.playground.__NETWORK__.verana.network/oid4vc/vct/cedula-digital",
      "name": "CedulaDigital",
      "description": "The Cedula Digital - national identity credential of the Estado Plurinacional de Bolivia (demo) (demo)",
      "vtjscId": "https://segip.bolivia.playground.__NETWORK__.verana.network/vt/schemas-cedula-digital-jsc.json",
      "claims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "disclosureFrame": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "ttlSeconds": 2592000
    },
    {
      "id": "bolivia-legal-rep",
      "format": "dc+sd-jwt",
      "vct": "https://seprec.bolivia.playground.__NETWORK__.verana.network/oid4vc/vct/bolivia-legal-rep",
      "name": "LegalRepresentative",
      "description": "Proof of legal representation issued by the SEPREC (demo) of the Estado Plurinacional de Bolivia (demo) (demo)",
      "vtjscId": "https://seprec.bolivia.playground.__NETWORK__.verana.network/vt/schemas-legal-representative-jsc.json",
      "claims": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "disclosureFrame": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "cedula-digital",
      "credentialConfigurationId": "cedula-digital",
      "requestedClaims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality"]
    },
    {
      "id": "bolivia-legal-rep",
      "credentialConfigurationId": "bolivia-legal-rep",
      "requestedClaims": ["companyName", "companyRegistryId", "representativeName", "role", "powers"]
    }
  ]
}
