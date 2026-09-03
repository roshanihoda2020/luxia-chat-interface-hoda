import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collectFileTagOptions,
  fileMatchesTagFilter,
  filesHaveUntagged,
} from "./fileTagFilter";
import { useDataSourceTagStore } from "./useDataSourceTags";

export function useFileTagFilter(
  fileNames: readonly string[],
  sourceIds: readonly string[],
) {
  const store = useDataSourceTagStore();

  const tagOptions = useMemo(
    () => collectFileTagOptions(fileNames, sourceIds),
    [fileNames, sourceIds, store],
  );
  const hasUntagged = useMemo(
    () => filesHaveUntagged(fileNames, sourceIds),
    [fileNames, sourceIds, store],
  );

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [untaggedSelected, setUntaggedSelected] = useState(false);

  useEffect(() => {
    const valid = new Set(tagOptions.map((tag) => tag.id));
    setSelectedTagIds((current) => {
      const next = current.filter((id) => valid.has(id));
      return next.length === current.length ? current : next;
    });
  }, [tagOptions]);

  useEffect(() => {
    if (!hasUntagged) setUntaggedSelected(false);
  }, [hasUntagged]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((current) => (
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    ));
  }, []);

  const toggleUntagged = useCallback(() => {
    setUntaggedSelected((current) => !current);
  }, []);

  const clear = useCallback(() => {
    setSelectedTagIds([]);
    setUntaggedSelected(false);
  }, []);

  const matches = useCallback(
    (fileName: string) =>
      fileMatchesTagFilter(fileName, sourceIds, selectedTagIds, untaggedSelected),
    [sourceIds, selectedTagIds, untaggedSelected, store],
  );

  const hasActiveTagFilters = selectedTagIds.length > 0 || untaggedSelected;

  return {
    tagOptions,
    hasUntagged,
    selectedTagIds,
    untaggedSelected,
    hasActiveTagFilters,
    toggleTag,
    toggleUntagged,
    clear,
    matches,
  };
}
