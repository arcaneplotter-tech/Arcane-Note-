import React from 'react';

export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'this', 'that', 'these', 'those', 
  'i', 'you', 'he', 'she', 'we', 'they', 'it', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might',
  'who', 'what', 'where', 'when', 'why', 'how', 'which',
  'not', 'no', 'yes', 'so', 'up', 'down', 'out', 'about', 'from', 'into', 'over', 'after', 'before', 'between', 'through', 'during', 'under', 'above', 'below', 'around', 'near', 'far',
  'very', 'too', 'also', 'just', 'only', 'than', 'then', 'already', 'yet', 'still', 'even', 'rather', 'quite', 'almost', 'enough',
  'me', 'him', 'us', 'them', 'whom', 'whose', 'as', 'if', 'while', 'because', 'since', 'though', 'although', 'whether'
]);

export const stem = (word: string) => {
  if (word.length < 3) return word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  return word.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/(?:ing|ed|es|s)$/, "");
};

export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const isFuzzyMatch = (word1: string, word2: string): boolean => {
  const s1 = stem(word1);
  const s2 = stem(word2);
  if (s1 === s2) return true;
  
  // For longer words, allow some distance
  const maxDist = Math.floor(Math.max(s1.length, s2.length) * 0.3); // 30% error margin
  const dist = getLevenshteinDistance(s1, s2);
  return dist <= Math.max(1, maxDist);
};

export const getCleanWords = (text: string) => {
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w));
};
