public with sharing class filePreviewAndDownloadController {
    @AuraEnabled(cacheable=true)
        public static Map<ID, String> getRelatedFilesByRecordId(String recordId) {
            // Get record file IDs        
            List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId];
            List<ID> fileIDs = new List<ID>();
            for (ContentDocumentLink docLink : files) {
                fileIDs.add(docLink.ContentDocumentId);
            }
     
            List<ContentVersion> docs = [SELECT ContentDocumentId, FileExtension, Title 
                FROM ContentVersion WHERE ContentDocumentId IN : fileIDs];
            Map<ID, String> mapIdTitle = new Map<ID, String>();
            for (ContentVersion docLink : docs) {
                mapIdTitle.put(docLink.ContentDocumentId, docLink.Title);
            }
            return mapIdTitle;
        }
        @AuraEnabled
public static void deleteDocument(Id recordId,Id documentId) {
    System.debug('documentId' + documentId);

    try {
        //Retrieve ContentDocumentLink records associated with the document
        List<ContentDocumentLink> documentLinksToDelete = [
            SELECT Id
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :recordId AND ContentDocumentId = :documentId
        ];
        System.debug('documentLinksToDelete'+documentLinksToDelete);

        // Delete ContentDocumentLink records
        delete documentLinksToDelete;

        

    } catch (DMLException e) {
        for (Integer i = 0; i < e.getNumDml(); i++) {
            System.debug('DML Exception at index ' + i + ': ' + e.getDmlMessage(i));
        }
        throw new AuraHandledException('Error deleting document: ' + e.getMessage());
    }
}
    @AuraEnabled
    public static void deleteDoc(List <ContentDocument> documentIdList){
        try {
        if(!documentIdList.isEmpty()){
            delete documentIdList;
        }
    }catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}
}