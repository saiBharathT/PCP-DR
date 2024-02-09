public with sharing class fileUploaderClass {

    @AuraEnabled
    public static String uploadFile(String base64, String filename, String recordId, String library) {
        try {
            // Check if the file with the same name exists
            List<ContentVersion> existingVersions = [SELECT Title,Id FROM ContentVersion WHERE Title = :filename LIMIT 1];
            if(!existingVersions.isEmpty()) {
                throw new AuraHandledException('A file with the same name already exists. Please rename your file.');
            }

            // Set library to the default folder ("Other") if not specified
            if (String.isBlank(library)) {
                ContentWorkspace defaultLibrary = [SELECT Id FROM ContentWorkspace WHERE Name = 'Other' LIMIT 1];
                if (defaultLibrary != null) {
                    library = defaultLibrary.Id;
                } else {
                    // Handle the case where the default folder ("Other") doesn't exist
                    throw new AuraHandledException('Default library "Other" not found.');
                }
            }

            ContentVersion cv = createContentVersion(base64, filename);
            ContentDocumentLink cdl = createContentLink(cv.Id, recordId, library);

            if (cv == null || cdl == null) {
                throw new AuraHandledException('Error uploading file.');
            }

            return cdl.Id;
        } catch(AuraHandledException e) {
            throw e; // Rethrow AuraHandledException to maintain consistency
        } catch(Exception e) {
            // For all other exceptions, log the error and return a generic message
            System.debug('An error occurred: ' + e.getMessage());
            throw new AuraHandledException('An error occurred. Please try again later.');
        }
    }
  private static ContentVersion createContentVersion(String base64, String filename) {
      ContentVersion cv = new ContentVersion();
      cv.VersionData = EncodingUtil.base64Decode(base64);
      cv.Title = filename;
      cv.PathOnClient = filename;

      try {
          insert cv;
          return cv;
      } catch(DMLException e) {
          System.debug(e);
          return null;
      }
  }

  private static ContentDocumentLink createContentLink(String contentVersionId, String recordId, String library) {
      if (contentVersionId == null || recordId == null || library == null) { return null; }
      System.debug('library'+library);
      ContentWorkspace libraryWorkspace = [SELECT Id FROM ContentWorkspace WHERE Id = :library LIMIT 1];
      if (libraryWorkspace == null) {
        System.debug('Library not found: ' + library);
        return null;
    }
      ContentDocumentLink cdl = new ContentDocumentLink();
      cdl.ContentDocumentId = [
          SELECT ContentDocumentId 
          FROM ContentVersion 
          WHERE Id =: contentVersionId
      ].ContentDocumentId;
      cdl.LinkedEntityId = recordId;
      cdl.ShareType = 'V';

    ContentWorkspaceDoc cwd = new ContentWorkspaceDoc();
    cwd.ContentWorkspaceId = libraryWorkspace.Id;
    cwd.ContentDocumentId = cdl.ContentDocumentId;
      try {
          insert cdl;
          insert cwd;
          return cdl;
      } catch(DMLException e) {
          System.debug(e);
          return null;
      }
  }

  public class WorkspaceFolder {
      @AuraEnabled public String Id;
      @AuraEnabled public String Name;

      public WorkspaceFolder(String id, String name) {
          this.Id = id;
          this.Name = name;
      }
  }

  @AuraEnabled(cacheable=true)
  public static List<WorkspaceFolder> getWorkspaceFolders(String cacheKey) {
      List<WorkspaceFolder> folders = new List<WorkspaceFolder>();

      // Query ContentWorkspace to get workspace folders
      for (ContentWorkspace ws : [SELECT Id, Name FROM ContentWorkspace]) {
          folders.add(new WorkspaceFolder(ws.Id, ws.Name));
      }

      return folders;
  }
  @AuraEnabled
public static Id createLibrary(String libraryName) {
    try {
        // Create a new ContentWorkspace with the specified name
        ContentWorkspace newWorkspace = new ContentWorkspace(
            Name = libraryName
        );

        // Insert the new ContentWorkspace
        insert newWorkspace;

        // Return a success message or any additional information
        return newWorkspace.Id;
    } catch (Exception e) {
        // Log the exception message
        System.debug('Error creating library: ' + e.getMessage());

        // Return the exception message for better troubleshooting
        return 'Error creating library: ' + e.getMessage();
    }
}
@AuraEnabled(cacheable=true)
    public static List<ContentDocument> getFiles() {
        return [SELECT Title,Id,OwnerId,LastModifiedDate FROM ContentDocument ];
    }
    @AuraEnabled(cacheable=true)
    public static List<String> getFileTypeOptions() {
        List<String> picklistValues = new List<String>();
        Schema.DescribeFieldResult fieldResult = File_Type__mdt.Type__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

        for(Schema.PicklistEntry entry : picklistEntries) {
            picklistValues.add(entry.getValue());
        }
        return picklistValues;
    }
}