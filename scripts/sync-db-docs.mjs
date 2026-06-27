import { mkdir, readdir, readFile, rm, stat, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations')
const docsDir = path.join(repoRoot, 'supabase', 'docs')
const metadataPath = path.join(docsDir, 'metadata.json')

const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
const archiveRoot = metadata.archiveRoot
const archiveMigrationsDir = path.join(archiveRoot, 'migrations')

const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => file.endsWith('.sql'))
  .sort((left, right) => left.localeCompare(right))

const migrationContents = await Promise.all(
  migrationFiles.map(async (file) => ({
    file,
    sql: await readFile(path.join(migrationsDir, file), 'utf8'),
  })),
)

const schemaSql = migrationContents
  .map(({ file, sql }) => `-- Migration: ${file}\n\n${sql.trim()}\n`)
  .join('\n')
  .trimEnd() + '\n'

const tablesDoc = [
  '# Tables',
  '',
  ...metadata.tables.flatMap((table) => [
    `## ${metadata.schema}.${table.name}`,
    '',
    table.purpose,
    '',
    '| Column | Type | Notes |',
    '| --- | --- | --- |',
    ...table.columns.map((column) => `| ${column.name} | ${column.type} | ${column.notes} |`),
    '',
  ]),
].join('\n')

const relationshipsDoc = [
  '# Relationships',
  '',
  '| From | To | Type | Notes |',
  '| --- | --- | --- | --- |',
  ...metadata.relationships.map((relationship) => `| ${relationship.from} | ${relationship.to} | ${relationship.type} | ${relationship.notes} |`),
  '',
].join('\n')

const routinesDoc = metadata.routines?.length
  ? [
      '# Routines',
      '',
      '| Routine | Signature | Purpose |',
      '| --- | --- | --- |',
      ...metadata.routines.map((routine) => `| ${routine.name} | ${routine.signature} | ${routine.purpose} |`),
      '',
    ].join('\n')
  : ''

const readmeDoc = [
  '# Minus 40 Database',
  '',
  'This directory contains generated and maintained database reference artifacts for the Minus 40 Supabase schema.',
  '',
  '## Canonical Sources',
  '',
  '- `supabase/migrations/` in the repo',
  '- `supabase/docs/metadata.json` in the repo',
  '',
  '## Generated Artifacts',
  '',
  '- `schema.sql` -> concatenated SQL schema history',
  '- `tables.md` -> table descriptions',
  '- `relationships.md` -> relationship map',
  '- `migrations/` -> raw migration files',
  '',
  '## Maintenance Rule',
  '',
  'Run `npm run db:docs` after every schema change. This updates the repo-side docs and refreshes the local archive mirror.',
  '',
  '## Notes',
  '',
  ...metadata.notes.map((note) => `- ${note}`),
  '',
].join('\n')

await writeFile(path.join(docsDir, 'schema.sql'), schemaSql)
await writeFile(path.join(docsDir, 'tables.md'), tablesDoc)
await writeFile(path.join(docsDir, 'relationships.md'), relationshipsDoc)
if (routinesDoc) {
  await writeFile(path.join(docsDir, 'routines.md'), routinesDoc)
}
await writeFile(path.join(docsDir, 'README.md'), readmeDoc)

await mkdir(archiveRoot, { recursive: true })
await mkdir(archiveMigrationsDir, { recursive: true })
await rm(archiveMigrationsDir, { recursive: true, force: true })
await mkdir(archiveMigrationsDir, { recursive: true })

for (const file of migrationFiles) {
  await copyFile(path.join(migrationsDir, file), path.join(archiveMigrationsDir, file))
}

for (const file of ['schema.sql', 'tables.md', 'relationships.md', 'README.md', 'routines.md']) {
  try {
    await copyFile(path.join(docsDir, file), path.join(archiveRoot, file))
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw error
    }
  }
}

const archiveEntries = await readdir(archiveRoot)
const archiveSummary = await Promise.all(
  archiveEntries.map(async (entry) => {
    const target = path.join(archiveRoot, entry)
    const targetStat = await stat(target)

    return {
      entry,
      type: targetStat.isDirectory() ? 'dir' : 'file',
    }
  }),
)

console.log(JSON.stringify({
  migrations: migrationFiles,
  archiveRoot,
  archiveEntries: archiveSummary,
}, null, 2))
