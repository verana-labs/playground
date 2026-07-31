{
  "issuer": {
    "id": "demo",
    "displayName": "__SERVICE_NAME__",
    "signing": {
      "development": {
        "enabled": true,
        "commonName": "__SERVICE_NAME__"
      }
    }
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
  "verifierPolicies": []
}
