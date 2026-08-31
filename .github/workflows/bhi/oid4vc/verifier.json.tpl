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
      "northbank.bhi.playground.__NETWORK__.verana.network",
      "caledonian.bhi.playground.__NETWORK__.verana.network",
      "cirrus.bhi.playground.__NETWORK__.verana.network"
    ],
    "credentialIssuerCertificates": [],
    "developmentCertificateFingerprints": [__ISSUER_FINGERPRINTS__]
  },
  "credentialConfigurations": [
    {
      "id": "bhi-right-to-work",
      "format": "dc+sd-jwt",
      "vct": "https://northbank.bhi.playground.__NETWORK__.verana.network/oid4vc/vct/bhi-right-to-work",
      "name": "RightToWork",
      "description": "UK right-to-work status established by a certified DVS provider (demo)",
      "vtjscId": "https://northbank.bhi.playground.__NETWORK__.verana.network/vt/schemas-right-to-work-jsc.json",
      "claims": [
        "firstName",
        "surname",
        "birthDate",
        "portrait",
        "nationality",
        "rtwEstablishedDate",
        "rtwExpiryDate"
      ],
      "disclosureFrame": [
        "firstName",
        "surname",
        "birthDate",
        "portrait",
        "nationality",
        "rtwEstablishedDate",
        "rtwExpiryDate"
      ],
      "ttlSeconds": 2592000
    },
    {
      "id": "bhi-employment",
      "format": "dc+sd-jwt",
      "vct": "https://northbank.bhi.playground.__NETWORK__.verana.network/oid4vc/vct/bhi-employment",
      "name": "Employment",
      "description": "One employment relationship, from HMRC payroll records under the DUAA 2025 gateway (demo)",
      "vtjscId": "https://northbank.bhi.playground.__NETWORK__.verana.network/vt/schemas-employment-jsc.json",
      "claims": [
        "employer",
        "startDate",
        "endDate"
      ],
      "disclosureFrame": [
        "employer",
        "startDate",
        "endDate"
      ],
      "ttlSeconds": 2592000
    },
    {
      "id": "bhi-qualification",
      "format": "dc+sd-jwt",
      "vct": "https://caledonian.bhi.playground.__NETWORK__.verana.network/oid4vc/vct/bhi-qualification",
      "name": "Qualification",
      "description": "A qualification awarded by an educational or certification body (demo)",
      "vtjscId": "https://caledonian.bhi.playground.__NETWORK__.verana.network/vt/schemas-qualification-jsc.json",
      "claims": [
        "issuingEstablishment",
        "dateAwarded",
        "qualificationSubject",
        "qualificationType",
        "gradeAwarded"
      ],
      "disclosureFrame": [
        "issuingEstablishment",
        "dateAwarded",
        "qualificationSubject",
        "qualificationType",
        "gradeAwarded"
      ],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": [
    {
      "id": "bhi-right-to-work",
      "credentialConfigurationId": "bhi-right-to-work",
      "requestedClaims": [
        "firstName",
        "surname",
        "nationality",
        "rtwEstablishedDate",
        "rtwExpiryDate"
      ]
    },
    {
      "id": "bhi-employment",
      "credentialConfigurationId": "bhi-employment",
      "requestedClaims": [
        "employer",
        "startDate",
        "endDate"
      ]
    },
    {
      "id": "bhi-qualification",
      "credentialConfigurationId": "bhi-qualification",
      "requestedClaims": [
        "issuingEstablishment",
        "dateAwarded",
        "qualificationSubject",
        "qualificationType",
        "gradeAwarded"
      ]
    }
  ]
}
