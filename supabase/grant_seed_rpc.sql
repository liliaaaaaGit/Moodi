-- Einmalig ausfuehren, damit eingeloggte Nutzer seed_user_defaults aufrufen koennen
grant execute on function seed_user_defaults(uuid) to authenticated;
