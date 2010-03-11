package org.openqa.selenium.ide;

import junit.framework.TestCase;

import java.io.File;
import java.io.IOException;

import org.openqa.selenium.AbstractDriverTestCase;
import org.openqa.selenium.By;
import org.openqa.selenium.NeedsDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;

public class IDECoreTest extends TestCase {
  private FirefoxDriver driver;
  private String testName;
  private static final String TEST_PATH = "chrome://selenium-ide/content/selenium-tests/tests/";

  public IDECoreTest(FirefoxDriver driver, String testName) {
    super(testName);
    this.driver = driver;
    this.testName = testName;
  }

  @Override
  public void runTest() throws Exception {
    driver.get("chrome://selenium-ide/content/tests/runner.html");
    while(Boolean.TRUE.equals(driver.executeScript("return SeleniumIDE.Loader.getTopEditor() == null;"))){
      Thread.sleep(100);
    }
    driver.executeScript("runTest('"+testName+"')");
    while("running".equals(driver.findElement(By.id("testResults")).getText())){
      Thread.sleep(100);
    }
    assertEquals("succeeded", driver.findElement(By.id("testResults")).getText());
  }
}
