Feature: Ardoq Gradle

    Scenario: Adds dependencies to Ardoq
      Given A payload of 'src/test/resources/gradle-dependencies.log'
      And My repo is send-letter-service
      When I POST to '/api/gradle/send-letter-service'
      Then The response should have a status code of 200
      And The EXISTING count should equal 96
      And The CREATED count should equal 0
      And The ERROR count should equal 0
