#!/usr/bin/env bash
# BHI-cast-specific helpers, shared by the provision-* scripts in this
# directory. Sourced AFTER vesta/common.sh (uses its helpers throughout -
# the verandia-cast lib.sh precedent). All BHI schemas are issuance-governed
# and verification-OPEN, so the generic vesta helpers cover everything; this
# lib only declares the cast's releases and hosts.

# ---------------------------------------------------------------------------
# The cast - Helm release names (also the in-cluster service names)
# ---------------------------------------------------------------------------

R_OID="orchestrating-identity"
R_TVS="tvs"
R_INSTITUTE="institute"
R_NORTHBANK="northbank"
R_CALEDONIAN="caledonian"
R_CIRRUS="cirrus"
# "meridian-tech" - the verandia cast already owns the "meridian-bank"
# release in the shared namespace; the public host stays meridian.<zone>.
R_MERIDIAN="meridian-tech"
R_JOBSEARCH="jobsearch"
R_HALCYON="halcyon"

# Public hosts derive from the BHI zone:
# <org>.bhi.playground.<network>.verana.network
bhi_zone() { echo "bhi.$(cast_zone)"; }

OID_HOST="${R_OID}.$(bhi_zone)"
TVS_HOST="${R_TVS}.$(bhi_zone)"
INSTITUTE_HOST="${R_INSTITUTE}.$(bhi_zone)"
NORTHBANK_HOST="${R_NORTHBANK}.$(bhi_zone)"
CALEDONIAN_HOST="${R_CALEDONIAN}.$(bhi_zone)"
CIRRUS_HOST="${R_CIRRUS}.$(bhi_zone)"
MERIDIAN_HOST="meridian.$(bhi_zone)"
JOBSEARCH_HOST="${R_JOBSEARCH}.$(bhi_zone)"
HALCYON_HOST="${R_HALCYON}.$(bhi_zone)"
