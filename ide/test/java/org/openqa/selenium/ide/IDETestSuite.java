package org.openqa.selenium.ide;

import junit.extensions.TestSetup;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.openqa.selenium.Ignore.Driver.FIREFOX;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.Platform;
import org.openqa.selenium.TestSuiteBuilder;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.internal.FileHandler;
import org.openqa.selenium.internal.TemporaryFilesystem;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class IDETestSuite extends TestCase {
  private FirefoxDriver driver = null;

  public static Test suite() throws Exception {
    TestSuite suite = new TestSuite(IDETestSuite.class);
    return addCoreTests(suite);
  }

  private static Test addCoreTests(TestSuite suite) throws Exception {
    FirefoxProfile profile = new FirefoxProfile();
    profile.addExtension(findIDEExtensionRootInSourceCode());
    final FirefoxDriver persistentDriver = new FirefoxDriver(profile);
    File coreTestsDir = findCoreTestsInSourceCode();
    File[] files = coreTestsDir.listFiles(new FilenameFilter(){
      public boolean accept(File dir, String name) {
        return name.endsWith(".html");
      }
    });
    for(File testFile : files){
      suite.addTest(new IDECoreTest(persistentDriver, testFile.getName()));
    }
    return new TestSetup(suite){
      @Override
      protected void tearDown() throws Exception {
        System.err.println("Closing driver");
        persistentDriver.close();
      }
    };
  }

  public void testExtensionFinding() throws Exception {
    findIDEExtensionRootInSourceCode();
  }

  @Override
  protected void tearDown() throws Exception {
    if(driver != null){
      driver.close();
      driver = null;
    }
  }

  public void testLoadingOfTestsPage() throws Exception {
    FirefoxProfile profile = new FirefoxProfile();
    profile.addExtension(findIDEExtensionRootInSourceCode());
    driver = new FirefoxDriver(profile);
    driver.get("chrome://selenium-ide/content/tests/index.html");
    assertThat(driver.findElementById("unitTestLink").getText(), equalTo("Run unit tests"));
    driver.close();
  }


  public void testFunctionalTests() throws Exception {
    FirefoxProfile profile = new FirefoxProfile();
    profile.addExtension(findIDEExtensionRootInSourceCode());
    driver = new FirefoxDriver(profile);
    driver.get("chrome://selenium-ide-testrunner/content/selenium/"+
               "TestRunner.html?test=chrome://selenium-ide-testrunner/content"+
               "/tests/functional/TestSuite.html&auto=true");
    driver.switchTo().frame("testSuiteFrame");
    WebElement title = null;
    for(;;){
      if(title == null){
        try{
          title = driver.findElement(By.cssSelector("tr.title"));
        } catch (NoSuchElementException e){}
      } else {
        String titleClass = title.getAttribute("class").trim();
        if(!titleClass.equals("title")){
          // test finished
          assertTrue("IDE functional tests failed", titleClass.contains("status_passed"));
          break;
        }
      }
      Thread.sleep(100);
    }
  }

  static File findIDEExtensionRootInSourceCode() {
    String[] possiblePaths = {
        "ide/src/extension",
        "../ide/src/extension",
        "../../ide/src/extension",
    };

    File current;
    for (String potential : possiblePaths) {
      current = new File(potential);
      if (current.exists()) {
        return current;
      }
    }

    throw new WebDriverException("Unable to locate IDE driver extension in developer source");
  }

  static File findCoreTestsInSourceCode() {
    String[] possiblePaths = {
        "ide/src/extension/content/selenium-tests/tests",
        "../ide/src/extension/content/selenium-tests/tests",
        "../../ide/src/extension/content/selenium-tests/tests",
    };

    File current;
    for (String potential : possiblePaths) {
      current = new File(potential);
      if (current.exists()) {
        return current;
      }
    }

    throw new WebDriverException("Unable to locate IDE driver extension in developer source");
  }

}
