{
  "issuer": {
    "id": "demo-did",
    "displayName": "__SERVICE_NAME__",
    "metadataSigner": "did",
    "signing": {
      "development": {
        "enabled": true,
        "commonName": "__SERVICE_NAME__"
      }
    },
    "keyAttestationCertificates": [
      "MIIC0zCCAnmgAwIBAgIUXRXxkLbUM6+njr/XT0IIw/HA/uowCgYIKoZIzj0EAwMwVzEZMBcGA1UEAwwQUElEIElzc3VlciBDQSAwMjEtMCsGA1UECgwkRVVESSBXYWxsZXQgUmVmZXJlbmNlIEltcGxlbWVudGF0aW9uMQswCQYDVQQGEwJFVTAeFw0yNTA0MDkwMDAzMzBaFw0zNDA3MDYwMDAzMjlaMFcxGTAXBgNVBAMMEFBJRCBJc3N1ZXIgQ0EgMDIxLTArBgNVBAoMJEVVREkgV2FsbGV0IFJlZmVyZW5jZSBJbXBsZW1lbnRhdGlvbjELMAkGA1UEBhMCRVUwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARkqdLmwIlv+SSWr00tAIrt7EAMztgd3w9qA6qEm16yVfsLcyx2f4oIWuH45wa37J9GoNWpdeo27VoSoNMCzxOYo4IBITCCAR0wEgYDVR0TAQH/BAgwBgEB/wIBADAfBgNVHSMEGDAWgBRCUFC+ELgQ8J1EXI2/qxAI7ifcSTATBgNVHSUEDDAKBggrgQICAAABBzBDBgNVHR8EPDA6MDigNqA0hjJodHRwczovL3ByZXByb2QucGtpLmV1ZGl3LmRldi9jcmwvcGlkX0NBX0VVXzAyLmNybDAdBgNVHQ4EFgQUQlBQvhC4EPCdRFyNv6sQCO4n3EkwDgYDVR0PAQH/BAQDAgEGMF0GA1UdEgRWMFSGUmh0dHBzOi8vZ2l0aHViLmNvbS9ldS1kaWdpdGFsLWlkZW50aXR5LXdhbGxldC9hcmNoaXRlY3R1cmUtYW5kLXJlZmVyZW5jZS1mcmFtZXdvcmswCgYIKoZIzj0EAwMDSAAwRQIhAIavYfC5o0VVLKfgTKkzzWgc09hzDMsCl3O2le2sQfG7AiA2soqAN5gtUOLQKWK00DUz22EW79rvaV+VJPvfdQeokA=="
    ]
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
      "claimDisplay": {
        "nombre": [{"locale": "es", "label": "Nombre", "description": "Nombre del asistente"}, {"locale": "en", "label": "Name", "description": "Attendee name"}],
        "tipo": [{"locale": "es", "label": "Tipo de boleto"}, {"locale": "en", "label": "Ticket type"}],
        "evento": [{"locale": "es", "label": "Evento"}, {"locale": "en", "label": "Event"}],
        "pais": [{"locale": "es", "label": "País"}, {"locale": "en", "label": "Country"}],
        "fecha": [{"locale": "es", "label": "Fecha"}, {"locale": "en", "label": "Date"}],
        "horario": [{"locale": "es", "label": "Horario"}, {"locale": "en", "label": "Time"}],
        "patrocinadores": [{"locale": "es", "label": "Patrocinadores"}, {"locale": "en", "label": "Sponsors"}]
      },
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
      "claimDisplay": {
        "organizacion": [{"locale": "es", "label": "Organización"}, {"locale": "en", "label": "Organization"}],
        "lema": [{"locale": "es", "label": "Lema"}, {"locale": "en", "label": "Tagline"}],
        "tipo": [{"locale": "es", "label": "Tipo de credencial"}, {"locale": "en", "label": "Credential type"}],
        "evento": [{"locale": "es", "label": "Evento"}, {"locale": "en", "label": "Event"}],
        "pais": [{"locale": "es", "label": "País"}, {"locale": "en", "label": "Country"}],
        "fecha": [{"locale": "es", "label": "Fecha"}, {"locale": "en", "label": "Date"}],
        "horario": [{"locale": "es", "label": "Horario"}, {"locale": "en", "label": "Time"}]
      },
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
  "verifierPolicies": []
}
