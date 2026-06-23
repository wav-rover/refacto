import type { Migration } from './runner';
import m001 from './001_init';
import m002 from './002_add_archived';
import m003 from './003_rename_archived';

// Liste ORDONNÉE des migrations du task-service. L'ordre du tableau fait foi.
const migrations: Migration[] = [m001, m002, m003];

export default migrations;
