public with sharing class fetchTeamMemberRecords {
    //for fetching the records of the team members.
    @AuraEnabled(cacheable = true)
    public static List<team_member__c> getTeamMembers(Id projectId)
    {   
        return [SELECT Id, Name, Project__c, Role__c, Total_Experience__c, employee__c FROM team_member__c WHERE Project__c =: projectId ORDER BY Name];    
    }
    //for removing them from the datatable as well as from the database.
    @AuraEnabled
    Public static void removeTeamMember(List<team_member__c> teamMemberList)
    {   
         if(teamMemberList != NULL)
         {
            delete teamMemberList;
         }
    } 
}