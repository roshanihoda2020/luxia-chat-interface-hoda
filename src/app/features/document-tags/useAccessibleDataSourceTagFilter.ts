import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accessibleSourcesHaveUntagged,
  collectAccessibleDataSourceTagOptions,
  dataSourceMatchesTagFilter,
} from "./dataSourceTagFilter";
import { useDataSourceTagStore } from "./useDataSourceTags";

export function useAccessibleDataSourceTagFilter(sourceIds: readonly string[]) {
  const store = useDataSourceTagStore();

  const tagOptions = useMemo(
    () => collectAccessibleDataSourceTagOptions(sourceIds),
    [sourceIds, store],
  );
  const hasUntagged = useMemo(
    () => accessibleSourcesHaveUntagged(sourceIds),
    [sourceIds, store],
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

  /** Apply a tag as an active filter without removing other selected tags. */
  const selectTag = useCallback((tagId: string) => {
    setSelectedTagIds((current) => (
      current.includes(tagId) ? current : [...current, tagId]
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
    (dataSourceId: string) =>
      dataSourceMatchesTagFilter(dataSourceId, selectedTagIds, untaggedSelected),
    [selectedTagIds, untaggedSelected, store],
  );

  const hasActiveTagFilters = selectedTagIds.length > 0 || untaggedSelected;

  return {
    tagOptions,
    hasUntagged,
    selectedTagIds,
    untaggedSelected,
    hasActiveTagFilters,
    toggleTag,
    selectTag,
    toggleUntagged,
    clear,
    matches,
  };
}
