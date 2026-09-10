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
      "taquilla.eventos.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "eventos-asistente",
      "format": "dc+sd-jwt",
      "vct": "https://taquilla.eventos.playground.__NETWORK__.verana.network/oid4vc/vct/eventos-asistente",
      "name": "AsistenteEvento",
      "description": "Boleto de asistente a un evento, emitido por Taquilla (demo)",
      "vtjscId": "https://taquilla.eventos.playground.__NETWORK__.verana.network/vt/schemas-asistente-jsc.json",
      "claims": [
        "nombre",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario",
        "patrocinadores"
      ],
      "disclosureFrame": [
        "nombre",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario",
        "patrocinadores"
      ],
      "ttlSeconds": 2592000
    },
    {
      "id": "eventos-patrocinador",
      "format": "dc+sd-jwt",
      "vct": "https://taquilla.eventos.playground.__NETWORK__.verana.network/oid4vc/vct/eventos-patrocinador",
      "name": "PatrocinadorEvento",
      "description": "Credencial de patrocinador de un evento, emitida por Taquilla (demo)",
      "vtjscId": "https://taquilla.eventos.playground.__NETWORK__.verana.network/vt/schemas-patrocinador-jsc.json",
      "claims": [
        "organizacion",
        "lema",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario"
      ],
      "disclosureFrame": [
        "organizacion",
        "lema",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario"
      ],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "eventos-asistente",
      "credentialConfigurationId": "eventos-asistente",
      "requestedClaims": [
        "nombre",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario"
      ]
    },
    {
      "id": "eventos-patrocinador",
      "credentialConfigurationId": "eventos-patrocinador",
      "requestedClaims": [
        "organizacion",
        "lema",
        "tipo",
        "evento",
        "pais",
        "fecha",
        "horario"
      ]
    }
  ]
}
