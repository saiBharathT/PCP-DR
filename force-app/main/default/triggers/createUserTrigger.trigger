trigger createUserTrigger on Team_Member__c (after insert) {
    Set<Id> newTeamMemberIds = new Set<Id>();
    for (Team_Member__c newTeamMember : Trigger.new) {
        newTeamMemberIds.add(newTeamMember.Id);
    }
    UserCreationHandler.createUserAsync(newTeamMemberIds);
}