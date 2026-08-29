// Quick test script to verify compatibility scoring diversity
// Run with: node test-compatibility.js

// Simulated participants from seed data
const participants = {
  'p-01': { id: 'p-01', name: 'Aryan Mehta', skills: ['React', 'TypeScript', 'Gemini API'] },
  'p-32': { id: 'p-32', name: 'Arjun Bose', skills: ['Backend', 'Microservices', 'gRPC'] },
  'p-33': { id: 'p-33', name: 'Swati Chopra', skills: ['Elasticsearch', 'Kibana', 'Grafana'] },
  'p-37': { id: 'p-37', name: 'Nisha Agarwal', skills: ['Tokenomics', 'Crypto', 'DeFi'] },
  'p-04': { id: 'p-04', name: 'Sneha Iyer', skills: ['UI/UX', 'Figma', 'CSS'] },
  'p-11': { id: 'p-11', name: 'Nikhil Patil', skills: ['iOS', 'Swift', 'ARKit'] },
  'p-19': { id: 'p-19', name: 'Simran Patel', skills: ['Product', 'Pitch Deck', 'Figma'] },
  'p-27': { id: 'p-27', name: 'Shruti Naik', skills: ['Content', 'SEO', 'Analytics'] },
};

function computeCompatibility(a, b) {
  const reasons = [];
  
  const aSkills = a.skills.map(s => s.toLowerCase());
  const bSkills = b.skills.map(s => s.toLowerCase());
  
  const aSet = new Set(aSkills);
  const bSet = new Set(bSkills);
  
  const overlapping = aSkills.filter(s => bSet.has(s));
  const uniqueToA = aSkills.filter(s => !bSet.has(s));
  const uniqueToB = bSkills.filter(s => !aSet.has(s));
  
  const totalSkills = aSkills.length + bSkills.length;
  const overlapCount = overlapping.length;
  const uniqueToBCount = uniqueToB.length;
  
  const overlapRatio = totalSkills > 0 ? overlapCount / totalSkills : 0;
  let score = 55 - (overlapRatio * 35);
  
  const uniqueContribution = uniqueToBCount * 18 - Math.pow(uniqueToBCount, 2) * 2;
  score += uniqueContribution;
  
  if (overlapCount === 1) {
    score += 15;
    reasons.push(`Shared expertise in ${overlapping[0]} helps communication.`);
  } else if (overlapCount === 2) {
    score += 8;
    reasons.push(`You both have ${overlapping[0]} and ${overlapping[1]} — some common ground.`);
  } else if (overlapCount >= 3) {
    score -= 12;
    reasons.push(`You both have ${overlapping.slice(0, 2).join(', ')} — significant skill redundancy.`);
  }
  
  const totalUniqueSkills = uniqueToA.length + uniqueToBCount;
  if (totalUniqueSkills >= 5) {
    score += 8;
  } else if (totalUniqueSkills <= 2) {
    score -= 5;
  }
  
  if (uniqueToBCount >= 3) {
    const topUnique = uniqueToB.slice(0, 2).join(' and ');
    const remaining = uniqueToBCount - 2;
    reasons.push(`They bring ${topUnique}${remaining > 0 ? ` plus ${remaining} more skill${remaining > 1 ? 's' : ''}` : ''}, adding strong diversity.`);
  } else if (uniqueToBCount === 2) {
    reasons.push(`They bring ${uniqueToB.join(' and ')}, complementing your skill set.`);
  } else if (uniqueToBCount === 1) {
    reasons.push(`They bring ${uniqueToB[0]}, adding some diversity to the team.`);
  } else if (uniqueToBCount === 0 && overlapCount > 0) {
    reasons.push(`All their skills overlap with yours — limited diversity benefit.`);
  }
  
  if (overlapCount === 0 && uniqueToBCount >= 3) {
    score += 4;
    reasons.push(`Completely different skill sets create a well-rounded team.`);
  }
  
  if (totalSkills === 0) {
    score = 42;
    reasons.push(`Very few technical skills listed — hard to assess fit.`);
  }
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  if (reasons.length === 0) {
    reasons.push(`Moderate skill balance — could work together effectively.`);
    reasons.push(`Consider discussing project vision to assess alignment.`);
  } else if (reasons.length === 1) {
    reasons.push(`Overall compatibility: ${score >= 80 ? 'excellent' : score >= 65 ? 'strong' : score >= 50 ? 'good' : 'fair'} match.`);
  }
  
  return { participantId: b.id, score, reasons };
}

// Test Aryan (React, TypeScript, Gemini API) against various candidates
const aryan = participants['p-01'];
const testCandidates = [
  'p-32', // Backend, Microservices, gRPC - completely different
  'p-33', // Elasticsearch, Kibana, Grafana - completely different
  'p-37', // Tokenomics, Crypto, DeFi - completely different
  'p-04', // UI/UX, Figma, CSS - somewhat related (frontend)
  'p-19', // Product, Pitch Deck, Figma - 1 overlap (Figma with p-04, not Aryan)
  'p-11', // iOS, Swift, ARKit - completely different
];

console.log('=== Compatibility Scores for Aryan Mehta ===\n');
console.log(`Aryan's skills: ${aryan.skills.join(', ')}\n`);

testCandidates.forEach(candidateId => {
  const candidate = participants[candidateId];
  const result = computeCompatibility(aryan, candidate);
  
  console.log(`${candidate.name} (${candidate.skills.join(', ')})`);
  console.log(`  Score: ${result.score}`);
  console.log(`  Reasons:`);
  result.reasons.forEach(r => console.log(`    • ${r}`));
  console.log('');
});
