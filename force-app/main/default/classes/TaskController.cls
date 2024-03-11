public with sharing class TaskController {
    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getTasks(Id recordId) {
        return [SELECT Id, Name,Assigned_To__c,Related_To__r.Name,Assignment_Type__c,Description__c,Assigned_to__r.employee__c,Due_Date__c,Priority__c,Related_To__c,Status__c,Subject__c From Assignment__c WHERE assigned_to__r.employee__c = :recordId];
    }
    @AuraEnabled(cacheable=true)
    public static List<String> getStatusPicklistValues() {
        List<String> picklistValues = new List<String>();
        Schema.DescribeFieldResult fieldResult = Assignment__c.status__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

        for(Schema.PicklistEntry entry : picklistEntries) {
            picklistValues.add(entry.getValue());
        }
        return picklistValues;
    }
    
}