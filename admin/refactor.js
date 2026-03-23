const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const classMap = {
    'bg-white dark:bg-slate-900': 'bg-[#131b2e]',
    'bg-slate-50 dark:bg-slate-800/50': 'bg-[#171f33]',
    'bg-slate-100 dark:bg-slate-800/50': 'bg-[#222a3d]',
    'bg-slate-100 dark:bg-slate-800': 'bg-[#222a3d]',
    'bg-slate-900 dark:bg-white': 'bg-[#adc6ff]',
    'border-slate-200/60 dark:border-slate-800/60': 'border-[#434655]/20',
    'border-slate-200 dark:border-slate-800': 'border-[#434655]/20',
    'border-slate-200 dark:border-slate-700': 'border-[#434655]/20',
    'border-slate-100 dark:border-slate-800/60': 'border-[#434655]/15',
    'border-slate-100 dark:border-slate-800': 'border-[#434655]/15',
    'border-slate-50 dark:border-slate-800/30': 'border-[#434655]/5',
    'text-slate-900 dark:text-white': 'text-[#dae2fd]',
    'text-slate-900 dark:text-slate-100': 'text-[#dae2fd]',
    'text-white dark:text-slate-900': 'text-[#001a42]',
    'text-slate-500 dark:text-slate-400': 'text-[#c3c5d8]/80',
    'text-slate-400 dark:text-slate-500': 'text-[#c3c5d8]/60',
    'text-slate-600 dark:text-slate-300': 'text-[#c3c5d8]',
    'text-slate-600 dark:text-slate-400': 'text-[#c3c5d8]',
    'text-blue-500 dark:text-blue-400': 'text-[#adc6ff]',
    'text-blue-600 dark:text-blue-400': 'text-[#adc6ff]',
    'bg-blue-50 dark:bg-blue-500/10': 'bg-[#adc6ff]/10',
    'bg-blue-500 hover:bg-blue-600': 'bg-[#1f70e3] hover:bg-[#005ac2]',
    'hover:bg-slate-50 dark:hover:bg-slate-800/50': 'hover:bg-[#171f33]',
    'hover:bg-slate-50 dark:hover:bg-slate-700/50': 'hover:bg-[#171f33]',
    'hover:bg-slate-100 dark:hover:bg-slate-800': 'hover:bg-[#222a3d]',
};

// Also recursively replace
function replaceInFile(filePath) {
    // Skip Dashboard.tsx as we already handcrafted it
    if (filePath.endsWith('Dashboard.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [oldClass, newClass] of Object.entries(classMap)) {
        content = content.split(oldClass).join(newClass);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directoryPath);
console.log('Class replacement complete.');
