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
      "civil-registry.utopia.playground.__NETWORK__.verana.network",
      "business-registry.utopia.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "utopia-citizen-id",
      "format": "dc+sd-jwt",
      "vct": "https://civil-registry.utopia.playground.__NETWORK__.verana.network/oid4vc/vct/utopia-citizen-id",
      "name": "UtopiaCitizenID",
      "description": "The Utopia Citizen ID - national identity credential of the Republica of Utopia (demo)",
      "vtjscId": "https://civil-registry.utopia.playground.__NETWORK__.verana.network/vt/schemas-utopia-citizen-id-jsc.json",
      "claims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "disclosureFrame": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality", "portrait", "issuingAuthority"],
      "ttlSeconds": 2592000
    },
    {
      "id": "utopia-legal-rep",
      "format": "dc+sd-jwt",
      "vct": "https://business-registry.utopia.playground.__NETWORK__.verana.network/oid4vc/vct/utopia-legal-rep",
      "name": "LegalRepresentative",
      "description": "Proof of legal representation issued by the National Business Registry of the Republica of Utopia (demo)",
      "vtjscId": "https://business-registry.utopia.playground.__NETWORK__.verana.network/vt/schemas-legal-representative-jsc.json",
      "claims": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "disclosureFrame": ["companyName", "companyRegistryId", "representativeName", "role", "powers", "validUntil"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "utopia-citizen-id",
      "credentialConfigurationId": "utopia-citizen-id",
      "requestedClaims": ["familyName", "givenName", "birthDate", "personalIdentifier", "nationality"]
    },
    {
      "id": "utopia-legal-rep",
      "credentialConfigurationId": "utopia-legal-rep",
      "requestedClaims": ["companyName", "companyRegistryId", "representativeName", "role", "powers"]
    }
  ]
}
