const { Plugin, Notice } = require("obsidian");

module.exports = class TagFromFoldersPlugin extends Plugin {
  async onload() {
    console.log("Cargando el plugin de Tags desde carpetas...");

    // Registrar el evento para interceptar el menú contextual
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file) {
          menu.addItem((item) => {
            item
              .setTitle("Añadir tags desde carpetas")
              .setIcon("tag")
              .onClick(() => {
                this.addTagsFromFolders(file);
              });
          });
        }
      })
    );

    // Añadir la opción al menú de click derecho
    this.addCommand({
      id: "add-tags-from-folders",
      name: "Añadir tags desde carpetas",
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;

        if (!checking) {
          this.addTagsFromFolders(activeFile);
        }

        return true;
      },
    });
  }

  // Función que añade los tags desde las carpetas
  async addTagsFromFolders(file) {
    if (file.children) {
      // Si se selecciona una carpeta, recorrer todos los archivos .md dentro
      await this.processFolder(file);
    } else {
      // Si se selecciona un archivo, aplicar la lógica de añadir tags
      await this.addTagsToFile(file, true);
    }
  }

  // Recorrer una carpeta y sus subcarpetas para procesar todos los archivos .md
  async processFolder(folder) {
    const files = folder.children;
    
    for (const child of files) {
      if (child.children) {
        // Si es una subcarpeta, procesarla recursivamente
        await this.processFolder(child);
      } else if (child.extension === "md") {
        // Si es un archivo .md, añadirle los tags
        await this.addTagsToFile(child, false);
      }
    }

    new Notice(`Tags añadidos a todos los archivos en ${folder.name}`);
  }

  // Función para añadir tags a un archivo individual
  async addTagsToFile(file, aviso) {
    const vaultPath = this.app.vault.getRoot().path;
    const filePath = "/" + file.path;

    if (filePath.startsWith(vaultPath)) {
      const relativePath = filePath.replace(vaultPath, "");
      const pathParts = relativePath.split("/").filter(Boolean);
      const folders = pathParts.slice(0, -1);

      if (folders.length > 0) {
        const nestedTag = `#${folders.join("/").replace(/\s+/g, '_')}`; // Crear el nested tag con todas las carpetas
        const fileContent = await this.app.vault.read(file);
        let updatedContent = fileContent;

        if (!fileContent.includes(nestedTag)) {
          updatedContent = `${nestedTag}\n${updatedContent}`;
        }

        if (updatedContent !== fileContent) {
          await this.app.vault.modify(file, updatedContent);
        }
        if (aviso){
          new Notice(`Tag añadido al archivo ${file.name}`);
        }
      } else {
        new Notice(`El archivo ${file.name} no está en una subcarpeta.`);
      }
    } else {
      new Notice("El archivo no se encuentra dentro del Vault.");
    }
  }

  onunload() {
    console.log("Descargando el plugin de Tags desde carpetas...");
  }
};
