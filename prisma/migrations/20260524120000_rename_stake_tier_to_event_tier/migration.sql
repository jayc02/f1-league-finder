DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'RaceSlot'
      AND column_name = 'stakeTierMetadata'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'RaceSlot'
      AND column_name = 'eventTierLabel'
  ) THEN
    ALTER TABLE "RaceSlot" RENAME COLUMN "stakeTierMetadata" TO "eventTierLabel";
  END IF;
END $$;
