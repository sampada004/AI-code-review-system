const repositoryService = require("./repositoryService");

async function detectProjectContext(repoId, branch) {
  try {
    const treeData = await repositoryService.getRepositoryTree(repoId, branch);
    const tree = treeData.tree || [];

    const context = {
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
    };

    const rootFiles = tree.filter(f => !f.path.includes('/'));

    // Check Node.js
    const packageJsonFile = rootFiles.find(f => f.path === 'package.json');
    if (packageJsonFile) {
      context.languages.push('JavaScript/TypeScript');
      context.tools.push('Node.js (npm/yarn)');

      try {
        const pkgStr = await repositoryService.getRepositoryFile(repoId, 'package.json', branch);
        const pkg = JSON.parse(pkgStr);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        // Frameworks
        if (deps['react']) context.frameworks.push('React');
        if (deps['next']) context.frameworks.push('Next.js');
        if (deps['vue']) context.frameworks.push('Vue.js');
        if (deps['@angular/core']) context.frameworks.push('Angular');
        if (deps['express']) context.frameworks.push('Express.js');
        if (deps['nestjs']) context.frameworks.push('NestJS');

        // Databases / ORMs
        if (deps['mysql'] || deps['mysql2']) context.databases.push('MySQL');
        if (deps['pg']) context.databases.push('PostgreSQL');
        if (deps['mongodb'] || deps['mongoose']) context.databases.push('MongoDB');
        if (deps['sequelize']) context.databases.push('Sequelize ORM');
        if (deps['prisma']) context.databases.push('Prisma ORM');
        if (deps['typeorm']) context.databases.push('TypeORM');

        // Testing
        if (deps['jest']) context.tools.push('Jest');
        if (deps['mocha']) context.tools.push('Mocha');
        if (deps['cypress']) context.tools.push('Cypress');
        
        // CSS
        if (deps['tailwindcss']) context.tools.push('Tailwind CSS');
      } catch (e) {
        console.error("Error parsing package.json:", e.message);
      }
    }

    // Check Python
    const requirementsTxt = rootFiles.find(f => f.path === 'requirements.txt');
    const pyprojectToml = rootFiles.find(f => f.path === 'pyproject.toml');
    if (requirementsTxt || pyprojectToml) {
      if (!context.languages.includes('Python')) context.languages.push('Python');
      
      let pyDeps = "";
      try {
        if (requirementsTxt) {
          pyDeps = await repositoryService.getRepositoryFile(repoId, 'requirements.txt', branch);
        } else if (pyprojectToml) {
          pyDeps = await repositoryService.getRepositoryFile(repoId, 'pyproject.toml', branch);
        }
        
        const pyDepsLower = pyDeps.toLowerCase();
        if (pyDepsLower.includes('django')) context.frameworks.push('Django');
        if (pyDepsLower.includes('flask')) context.frameworks.push('Flask');
        if (pyDepsLower.includes('fastapi')) context.frameworks.push('FastAPI');
        if (pyDepsLower.includes('psycopg2')) context.databases.push('PostgreSQL');
        if (pyDepsLower.includes('mysqlclient')) context.databases.push('MySQL');
        if (pyDepsLower.includes('pymongo')) context.databases.push('MongoDB');
        if (pyDepsLower.includes('sqlalchemy')) context.databases.push('SQLAlchemy ORM');
        if (pyDepsLower.includes('pytest')) context.tools.push('PyTest');
      } catch (e) {
         console.error("Error parsing python deps:", e.message);
      }
    }

    // Check Java
    const pomXml = rootFiles.find(f => f.path === 'pom.xml');
    if (pomXml) {
      if (!context.languages.includes('Java')) context.languages.push('Java');
      context.tools.push('Maven');
      try {
        const pom = await repositoryService.getRepositoryFile(repoId, 'pom.xml', branch);
        if (pom.includes('spring-boot')) context.frameworks.push('Spring Boot');
        if (pom.includes('hibernate')) context.databases.push('Hibernate ORM');
        if (pom.includes('mysql-connector')) context.databases.push('MySQL');
        if (pom.includes('postgresql')) context.databases.push('PostgreSQL');
        if (pom.includes('junit')) context.tools.push('JUnit');
      } catch(e) {}
    }

    // Check Go
    const goMod = rootFiles.find(f => f.path === 'go.mod');
    if (goMod) {
       if (!context.languages.includes('Go')) context.languages.push('Go');
    }

    // Deduplicate lists
    context.languages = [...new Set(context.languages)];
    context.frameworks = [...new Set(context.frameworks)];
    context.databases = [...new Set(context.databases)];
    context.tools = [...new Set(context.tools)];

    return context;
  } catch (error) {
    console.error("Failed to detect project context:", error);
    return null;
  }
}

module.exports = {
  detectProjectContext,
};
