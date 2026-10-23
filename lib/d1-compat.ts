// Mesma API de prepare().bind().first()/all()/run() e batch() usada com o D1,
// implementada sobre um cliente libSQL (Turso). O SQL do projeto permanece igual.
export type LibsqlLike = {
  execute(stmt: { sql: string; args: any[] }): Promise<{ columns: string[]; rows: any[]; rowsAffected: number }>;
  batch(stmts: { sql: string; args: any[] }[], mode?: 'write' | 'read' | 'deferred'): Promise<{ columns: string[]; rows: any[]; rowsAffected: number }[]>;
};
type Result<T> = { results: T[]; success: true; meta: { changes: number } };
function plain<T>(set: { columns: string[]; rows: any[]; rowsAffected: number }): Result<T> {
  const results = set.rows.map(row => Object.fromEntries(set.columns.map((c, i) => [c, row[i]]))) as T[];
  return { results, success: true, meta: { changes: set.rowsAffected } };
}
export class Statement {
  constructor(private client: LibsqlLike, readonly sql: string, readonly args: unknown[] = []) {}
  bind(...args: unknown[]) { return new Statement(this.client, this.sql, args); }
  toStmt() { return { sql: this.sql, args: this.args.map(v => (v === undefined ? null : v)) as any[] }; }
  async first<T = any>(): Promise<T | null> { return (plain<T>(await this.client.execute(this.toStmt())).results[0] ?? null) as T | null; }
  async all<T = any>() { return plain<T>(await this.client.execute(this.toStmt())); }
  async run() { return plain<never>(await this.client.execute(this.toStmt())); }
}
export function createD1Compat(client: LibsqlLike) {
  return {
    prepare: (sql: string) => new Statement(client, sql),
    batch: async (statements: Statement[]) => (await client.batch(statements.map(s => s.toStmt()), 'write')).map(set => plain<any>(set)),
  };
}
export type LeadDb = ReturnType<typeof createD1Compat>;
