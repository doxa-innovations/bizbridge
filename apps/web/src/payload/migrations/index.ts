import * as migration_20260609_135059_sync_payload_schema from './20260609_135059_sync_payload_schema';
import * as migration_20260722_000000_bilingual_operations from './20260722_000000_bilingual_operations';
import * as migration_20260722_010000_bilingual_operations_versions from './20260722_010000_bilingual_operations_versions';
import * as migration_20260722_020000_fix_version_array_ids from './20260722_020000_fix_version_array_ids';
import * as migration_20260809_000000_user_data_collections from './20260809_000000_user_data_collections';
import * as migration_20260809_010000_report_requests_custom from './20260809_010000_report_requests_custom';
import * as migration_20260810_000000_planning_canvases from './20260810_000000_planning_canvases';
import * as migration_20260810_010000_report_requests_screenshot_optional from './20260810_010000_report_requests_screenshot_optional';
import * as migration_20260811_000000_page_events from './20260811_000000_page_events';

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
  {
    up: migration_20260809_010000_report_requests_custom.up,
    down: migration_20260809_010000_report_requests_custom.down,
    name: '20260809_010000_report_requests_custom'
  },
  {
    up: migration_20260810_000000_planning_canvases.up,
    down: migration_20260810_000000_planning_canvases.down,
    name: '20260810_000000_planning_canvases'
  },
  {
    up: migration_20260810_010000_report_requests_screenshot_optional.up,
    down: migration_20260810_010000_report_requests_screenshot_optional.down,
    name: '20260810_010000_report_requests_screenshot_optional'
  },
  {
    up: migration_20260811_000000_page_events.up,
    down: migration_20260811_000000_page_events.down,
    name: '20260811_000000_page_events'
  },
];
