## Optional Future Consideration

### Possible return of the 125 kg milestone

Status:

- optional / future consideration only;
- do not change the current route unless this is explicitly approved.

Context:

- current approved route: `150 -> 140 -> 130 -> 120 -> 115 -> 110`;
- 125 kg may be reconsidered later if the `130 -> 120` jump feels too long or too hard.

If 125 kg is restored, the following must be updated together:

- route / milestones;
- Goals;
- Overview;
- Plateau logic;
- docs;
- dev-preview scenarios.

## Future Architecture Candidate

Potential later direction:

- Supabase remains the source of truth;
- local SQLite or similar database becomes a full mirrored working copy;
- the app reads from the local database;
- background sync keeps local data aligned with Supabase;
- Developer Preview reads the same local database.

This is a separate future architecture task, not part of the current Developer Preview work.
