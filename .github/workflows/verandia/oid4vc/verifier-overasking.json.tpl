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
      "civil-registry.verandia.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "verandia-citizen-id",
      "format": "dc+sd-jwt",
      "vct": "https://civil-registry.verandia.playground.__NETWORK__.verana.network/oid4vc/vct/verandia-citizen-id",
      "name": "VerandiaCitizenID",
      "description": "The Verandia Citizen ID - national identity credential of the Republic of Verandia (demo)",
      "vtjscId": "https://civil-registry.verandia.playground.__NETWORK__.verana.network/vt/schemas-verandia-citizen-id-jsc.json",
      "claims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "disclosureFrame": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "verandia-citizen-id",
      "credentialConfigurationId": "verandia-citizen-id",
      "requestedClaims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"]
    }
  ]
}
