#!/usr/bin/env bash
# Events-cast-specific helpers, shared by the provision-* scripts in this
# directory. Sourced AFTER vesta/common.sh (uses its helpers throughout -
# the ccm/bhi-cast lib.sh precedent). Both schemas are issuance-governed and
# verification-OPEN, so the generic vesta helpers cover everything; this lib
# only declares the cast's releases and hosts.

# ---------------------------------------------------------------------------
# The cast - Helm release names (also the in-cluster service names)
# ---------------------------------------------------------------------------

R_TAQUILLA="taquilla"
# The event releases carry an "evento-" prefix (the shared namespace holds
# every playground cast); the public hosts stay the bare country slugs.
R_COSTA_RICA="evento-costa-rica"
R_GUATEMALA="evento-guatemala"
R_PANAMA="evento-panama"

# Public hosts derive from the events zone:
# <org>.eventos.playground.<network>.verana.network
eventos_zone() { echo "eventos.$(cast_zone)"; }

TAQUILLA_HOST="${R_TAQUILLA}.$(eventos_zone)"
COSTA_RICA_HOST="costa-rica.$(eventos_zone)"
GUATEMALA_HOST="guatemala.$(eventos_zone)"
PANAMA_HOST="panama.$(eventos_zone)"
