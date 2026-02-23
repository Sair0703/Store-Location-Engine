#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 CHECKING STORE FILES...\n');

// Check both locations
const locations = [
  { name: 'Root directory', path: path.join(__dirname, '..') },
  { name: 'Scripts directory', path: __dirname }
];

for (const loc of locations) {
  console.log(`\n📁 ${loc.name}: ${loc.path}`);
  console.log('─'.repeat(60));
  
  for (const filename of ['walmart-stores.json', 'ralphs-stores.json']) {
    const filePath = path.join(loc.path, filename);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stores = JSON.parse(content);
      const portlandStores = stores.filter(s => 
        s.address && s.address.toLowerCase().includes('portland')
      );
      
      console.log(`✅ ${filename}:`);
      console.log(`   Total stores: ${stores.length}`);
      console.log(`   Portland stores: ${portlandStores.length}`);
      
      if (portlandStores.length > 0) {
        portlandStores.forEach(s => {
          console.log(`      - ${s.address}`);
        });
      }
    } else {
      console.log(`❌ ${filename}: NOT FOUND`);
    }
  }
}

console.log('\n');
