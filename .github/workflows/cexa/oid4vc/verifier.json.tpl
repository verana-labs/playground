{
  "verifier": {
    "id": "demo",
    "displayName": "__SERVICE_NAME__",
    "requestSigner": "did",
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
      "aurum.cexa.playground.__NETWORK__.verana.network",
      "novara.cexa.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "cexa-kyc",
      "format": "dc+sd-jwt",
      "vct": "https://aurum.cexa.playground.__NETWORK__.verana.network/oid4vc/vct/cexa-kyc",
      "name": "CEXA-Kyc",
      "description": "The reusable KYC credential of the Crypto Exchange Association (demo)",
      "vtjscId": "https://association.cexa.playground.__NETWORK__.verana.network/vt/schemas-cexa-kyc-jsc.json",
      "claims": ["fullName", "birthDate", "nationality", "documentNumberHash", "kycLevel", "screeningDate", "provider", "evidenceDigest"],
      "disclosureFrame": ["fullName", "birthDate", "nationality", "documentNumberHash", "kycLevel", "screeningDate", "provider", "evidenceDigest"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "cexa-kyc",
      "credentialConfigurationId": "cexa-kyc",
      "requestedClaims": ["fullName", "birthDate", "nationality", "documentNumberHash", "kycLevel", "screeningDate", "provider", "evidenceDigest"]
    }
  ]
}
