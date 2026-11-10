-- RenameTable
ALTER TABLE "types_ocurrence" RENAME TO "types_occurrence";

-- RenameIndex
ALTER INDEX "types_ocurrence_name_key" RENAME TO "types_occurrence_name_key";

-- RenamePrimaryKey
ALTER TABLE "types_occurrence" RENAME CONSTRAINT "types_ocurrence_pkey" TO "types_occurrence_pkey";

-- RenameTable
ALTER TABLE "ocurrences" RENAME TO "occurrences";

-- RenamePrimaryKey
ALTER TABLE "occurrences" RENAME CONSTRAINT "ocurrences_pkey" TO "occurrences_pkey";

-- RenameForeignKey
ALTER TABLE "occurrences" RENAME CONSTRAINT "ocurrences_type_id_fkey" TO "occurrences_type_id_fkey";

-- RenameForeignKey
ALTER TABLE "occurrences" RENAME CONSTRAINT "ocurrences_user_id_fkey" TO "occurrences_user_id_fkey";

-- RenameColumn
ALTER TABLE "like_ocurrences" RENAME COLUMN "ocurrence_id" TO "occurrence_id";

-- RenameTable
ALTER TABLE "like_ocurrences" RENAME TO "like_occurrences";

-- RenameIndex
ALTER INDEX "like_ocurrences_user_id_ocurrence_id_key" RENAME TO "like_occurrences_user_id_occurrence_id_key";

-- RenamePrimaryKey
ALTER TABLE "like_occurrences" RENAME CONSTRAINT "like_ocurrences_pkey" TO "like_occurrences_pkey";

-- RenameForeignKey
ALTER TABLE "like_occurrences" RENAME CONSTRAINT "like_ocurrences_user_id_fkey" TO "like_occurrences_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "like_occurrences" RENAME CONSTRAINT "like_ocurrences_ocurrence_id_fkey" TO "like_occurrences_occurrence_id_fkey";
