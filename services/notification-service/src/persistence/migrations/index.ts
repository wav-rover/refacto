import type { Migration } from './runner';
import m001 from './001_init';

// Liste ORDONNÉE des migrations du notification-service. L'ordre du tableau fait foi.
const migrations: Migration[] = [m001];

export default migrations;
