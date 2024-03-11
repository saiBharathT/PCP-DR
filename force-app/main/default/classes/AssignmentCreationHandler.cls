public with sharing class AssignmentCreationHandler {
    public class AssignmentWrapper {
        @AuraEnabled public String assignmentName;
        @AuraEnabled public String relatedTo;
        @AuraEnabled public String assignedTo;
        @AuraEnabled public String subject;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public Date dueDate; 
        @AuraEnabled public String assignmentType;
        @AuraEnabled public String parentAssignment;
        @AuraEnabled public List<SubassignmentWrapper> subassignments;
    }


    public class SubassignmentWrapper {
        @AuraEnabled public String assignmentName;
        @AuraEnabled public String relatedTo;
        @AuraEnabled public String assignedTo;
        @AuraEnabled public String subject;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String assignmentType; 
        @AuraEnabled public Date dueDate; 
        @AuraEnabled public String parentAssignment; 

    }

    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjectDetails(Id recordId) {
        if (recordId != null) {
            return [SELECT Id, Name FROM Project__c WHERE Id = :recordId];
        } else {
            return [SELECT Id, Name FROM Project__c];
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Team_Member__c> getRelatedTeamMembers(Id projectId) { 
                String teamMemberQuery = 'SELECT Id, Name FROM Team_Member__c WHERE Project__c = :projectId';
                return Database.query(teamMemberQuery);
            }

    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getParentAssignments() {
        return [SELECT Id, Name FROM Assignment__c];
    }

    @AuraEnabled
    public static List<Assignment__c> createAssignment(String assignmentWrapper) {
    System.debug('assignmentWrapper' + assignmentWrapper);
    List<Assignment__c> assignmentsToInsert = new List<Assignment__c>();
    List<Assignment__c> subassignmentsToInsert = new List<Assignment__c>();
    List<AssignmentWrapper> assignmentWrapperList = (List<AssignmentWrapper>) JSON.deserialize(assignmentWrapper, List<AssignmentWrapper>.class);
    System.debug('assignmentWrapperlist' + assignmentWrapperList);
    Map<String, Id> assignmentIdMap = new Map<String, Id>();
    Map<String, Id> subassignmentIdMap = new Map<String, Id>();

    // Extract assignment names from AssignmentWrapper objects
    Set<String> assignmentNames = new Set<String>();
    for (AssignmentWrapper assignmentData : assignmentWrapperList) {
        assignmentNames.add(assignmentData.assignmentName);
        if (assignmentData.subassignments != null && !assignmentData.subassignments.isEmpty()) {
            for (SubassignmentWrapper subassignmentData : assignmentData.subassignments) {
                assignmentNames.add(subassignmentData.assignmentName);
            }
        }
    }

    // Check for existing assignments and populate assignmentIdMap
    for (Assignment__c assignment : [SELECT Id, Name FROM Assignment__c WHERE Name IN :assignmentNames]) {
        assignmentIdMap.put(assignment.Name, assignment.Id);
    }

    // Insert parent assignments if they don't already exist
    for (AssignmentWrapper assignmentData : assignmentWrapperList) {
        if (!assignmentIdMap.containsKey(assignmentData.assignmentName)) {
            Assignment__c parentAssignment = new Assignment__c(
                
                Name = assignmentData.assignmentName,
                Related_To__c = assignmentData.relatedTo,
                Assigned_To__c = assignmentData.assignedTo,
                Subject__c = assignmentData.subject,
                Status__c = assignmentData.status,
                Priority__c = assignmentData.priority,
                Due_Date__c = assignmentData.dueDate,
                Assignment_Type__c = assignmentData.assignmentType,
                Parent_Assignment__c=assignmentData.parentAssignment
            );
            assignmentsToInsert.add(parentAssignment);
        }
    }

    // Insert new parent assignments
    if (!assignmentsToInsert.isEmpty()) {
        insert assignmentsToInsert;    
    }
        return assignmentsToInsert;
    }



  

}
