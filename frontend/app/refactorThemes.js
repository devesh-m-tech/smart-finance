const fs = require('fs');
const path = require('path');

const files = [
  'index.tsx',
  'expenses.tsx',
  'emi.tsx',
  'future.tsx'
];

const dir = 'c:/Users/DEVESH/Downloads/smart-finance/frontend/app/src/app/(tabs)';

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add import
  if (!content.includes("import { useTheme }")) {
    content = content.replace("import { useFinance }", "import { useTheme } from '../../context/ThemeContext';\nimport { useFinance }");
  }

  // Add hook call
  const componentName = file === 'index.tsx' ? 'Dashboard' : file === 'expenses.tsx' ? 'Expenses' : file === 'emi.tsx' ? 'EMI' : 'Future';
  const hookRegex = new RegExp(`export default function ${componentName}\\(\\) \\{\n`);
  content = content.replace(hookRegex, `export default function ${componentName}() {\n  const { colors } = useTheme();\n  const styles = getStyles(colors);\n`);

  // Replace styles definition
  content = content.replace("const styles = StyleSheet.create({", "const getStyles = (colors: any) => StyleSheet.create({");
  
  // Basic color replacements in styles
  content = content.replace(/'#050505'/g, "colors.background");
  content = content.replace(/'#12121A'/g, "colors.cardBackground");
  content = content.replace(/'#1e1e24'/g, "colors.border");
  content = content.replace(/'#ffffff'/g, "colors.text");
  
  // For #fff we replace mostly in the style definition to avoid breaking random hardcoded JSX icons right now, 
  // but it's safe to replace all #fff inside getStyles.
  const styleStart = content.indexOf('const getStyles');
  if (styleStart !== -1) {
    let beforeStyles = content.substring(0, styleStart);
    let stylesBlock = content.substring(styleStart);
    stylesBlock = stylesBlock.replace(/'#fff'/g, "colors.text");
    stylesBlock = stylesBlock.replace(/'#888'/g, "colors.subText");
    stylesBlock = stylesBlock.replace(/'#888888'/g, "colors.subText");
    content = beforeStyles + stylesBlock;
  }

  // Handle JSX inline colors #fff -> colors.text, #888 -> colors.subText where possible, 
  // but let's stick to using the `colors` variable.
  // Actually, wait, some icons need dynamic colors:
  content = content.replace(/color="#fff"/g, 'color={colors.text}');
  content = content.replace(/color="#888"/g, 'color={colors.subText}');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
