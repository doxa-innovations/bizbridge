import * as migration_20260609_135059_sync_payload_schema from './20260609_135059_sync_payload_schema';
import * as migration_20260722_000000_bilingual_operations from './20260722_000000_bilingual_operations';
import * as migration_20260722_010000_bilingual_operations_versions from './20260722_010000_bilingual_operations_versions';
import * as migration_20260722_020000_fix_version_array_ids from './20260722_020000_fix_version_array_ids';
import * as migration_20260809_000000_user_data_collections from './20260809_000000_user_data_collections';

export const migrations = [
  {
    up: migration_20260609_135059_sync_payload_schema.up,
    down: migration_20260609_135059_sync_payload_schema.down,
    name: '20260609_135059_sync_payload_schema'
  },
  {
    up: migration_20260722_000000_bilingual_operations.up,
    down: migration_20260722_000000_bilingual_operations.down,
    name: '20260722_000000_bilingual_operations'
  },
  {
    up: migration_20260722_010000_bilingual_operations_versions.up,
    down: migration_20260722_010000_bilingual_operations_versions.down,
    name: '20260722_010000_bilingual_operations_versions'
  },
  {
    up: migration_20260722_020000_fix_version_array_ids.up,
    down: migration_20260722_020000_fix_version_array_ids.down,
    name: '20260722_020000_fix_version_array_ids'
  },
  {
    up: migration_20260809_000000_user_data_collections.up,
    down: migration_20260809_000000_user_data_collections.down,
    name: '20260809_000000_user_data_collections'
  },
];
