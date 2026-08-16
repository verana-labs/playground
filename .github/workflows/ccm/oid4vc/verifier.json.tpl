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
      "camara.ccm.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "ccm-legal-rep",
      "format": "dc+sd-jwt",
      "vct": "https://camara.ccm.playground.__NETWORK__.verana.network/oid4vc/vct/ccm-legal-rep",
      "name": "RepresentacionLegal",
      "description": "Prueba de representacion legal emitida por la Camara de Comercio de Medellin para Antioquia (demo)",
      "vtjscId": "https://camara.ccm.playground.__NETWORK__.verana.network/vt/schemas-representacion-legal-jsc.json",
      "claims": ["companyName", "nit", "companyRegistryId", "representativeName", "representativeId", "role", "powers", "issuingChamber", "validUntil"],
      "disclosureFrame": ["companyName", "nit", "companyRegistryId", "representativeName", "representativeId", "role", "powers", "issuingChamber", "validUntil"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "ccm-legal-rep",
      "credentialConfigurationId": "ccm-legal-rep",
      "requestedClaims": ["companyName", "nit", "companyRegistryId", "representativeName", "representativeId", "role", "validUntil"]
    }
  ]
}
