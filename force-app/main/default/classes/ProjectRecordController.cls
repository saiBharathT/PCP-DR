public with sharing class ProjectRecordController {
    @AuraEnabled(cacheable=true)
    public static List<Project__c> getProjectsForEmployee(Id employeeId) {
        List<Team_Member__c> teamMembers = [SELECT Id,Project__r.Id, Project__r.Name 
                                           FROM Team_Member__c 
                                           WHERE Employee__c = :employeeId];
        
        List<Project__c> projects = new List<Project__c>();
        for (Team_Member__c teamMember : teamMembers) {
            projects.add(teamMember.Project__r);
        }
        System.debug('Projects'+projects);
        return projects;
    }
}