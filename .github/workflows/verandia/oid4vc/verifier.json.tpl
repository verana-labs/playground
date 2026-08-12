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
      "civil-registry.verandia.playground.__NETWORK__.verana.network",
      "business-registry.verandia.playground.__NETWORK__.verana.network"
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
    },
    {
      "id": "verandia-legal-rep",
      "format": "dc+sd-jwt",
      "vct": "https://business-registry.verandia.playground.__NETWORK__.verana.network/oid4vc/vct/verandia-legal-rep",
      "name": "LegalRepresentative",
      "description": "Proof of legal representation issued by the National Business Registry of the Republic of Verandia (demo)",
      "vtjscId": "https://business-registry.verandia.playground.__NETWORK__.verana.network/vt/schemas-legal-representative-jsc.json",
      "claims": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "disclosureFrame": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "verandia-citizen-id",
      "credentialConfigurationId": "verandia-citizen-id",
      "requestedClaims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality"]
    },
    {
      "id": "verandia-legal-rep",
      "credentialConfigurationId": "verandia-legal-rep",
      "requestedClaims": ["companyName", "companyRegistryId", "representativeName", "role", "powers"]
    }
  ]
}
