/**
 * How many topics one quiz request may carry.
 *
 * Shared so the topic selector can default and cap at the same number the
 * server enforces. Previously the cap lived only in the generate route, so the
 * selector happily preselected every topic and a large document produced a
 * request that could never succeed.
 */
export const MAX_TOPIC_IDS = 100;