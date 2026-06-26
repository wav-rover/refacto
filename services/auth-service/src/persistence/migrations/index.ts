import type { Migration } from './runner';
import m001 from './001_init';
import m002 from './002_add_birth_date';

// Liste ORDONNÉE des migrations de l'auth-service. L'ordre du tableau fait foi.
const migrations: Migration[] = [m001, m002];

export default migrations;
