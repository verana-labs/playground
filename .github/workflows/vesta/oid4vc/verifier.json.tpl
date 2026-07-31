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
      "vesta.playground.__NETWORK__.verana.network",
      "zenith.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "ecs-badge",
      "format": "dc+sd-jwt",
      "vct": "https://vesta.playground.__NETWORK__.verana.network/oid4vc/vct/ecs-badge",
      "name": "ECS-Badge",
      "description": "Employee badge of the Vesta cast (ECS BadgeCredential, demo)",
      "vtjscId": "https://vesta.playground.__NETWORK__.verana.network/vt/schemas-badge-jsc.json",
      "claims": ["badgeNumber", "name", "photo", "title", "department", "birthDate", "biometricPattern", "biometricPatternScheme"],
      "disclosureFrame": ["badgeNumber", "name", "photo", "title", "department"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "ecs-badge",
      "credentialConfigurationId": "ecs-badge",
      "requestedClaims": ["badgeNumber", "name", "title", "department"]
    }
  ]
}
