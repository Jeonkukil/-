const express = require("express");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const cors = require("cors");
const moment = require("moment");

// Express 앱을 설정합니다.
const app = express();
const port = 5001;

app.use(cors());

const convertTimeToDate = (time) => {
  const now = moment();
  if (time.includes("분 전")) {
    return now.format("YYYY-MM-DD");
  } else if (time.includes("시간 전")) {
    const hoursAgo = parseInt(time.split("시간 전")[0], 10);
    return now.subtract(hoursAgo, "hours").format("YYYY-MM-DD");
  } else if (time.includes("일 전")) {
    const daysAgo = parseInt(time.split("일 전")[0], 10);
    return now.subtract(daysAgo, "days").format("YYYY-MM-DD");
  } else if (time.includes("주 전")) {
    const weeksAgo = parseInt(time.split("주 전")[0], 10);
    return now.subtract(weeksAgo, "weeks").format("YYYY-MM-DD");
  } else {
    return time;
  }
};

app.get("/api/news", async (req, res) => {
  const query = req.query.query || "";
  let driver;

  try {
    const options = new chrome.Options();
    options.addArguments("start-maximized");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("브라우저를 열었습니다.");

    await driver.get(
      `https://search.naver.com/search.naver?ssc=tab.news.all&where=news&sm=tab_jum&query=${encodeURIComponent(
        query
      )}`
    );

    // await driver.get(
    //   `https://search.naver.com/search.naver?ssc=tab.news.all&where=news&sm=tab_jum&query=${encodeURIComponent(
    //     query
    //   )}&sort=1`
    // );

    console.log("네이버 뉴스 페이지로 이동했습니다.");

    await driver.wait(until.elementLocated(By.css(".list_news .bx")), 10000);
    console.log("페이지가 로드되었습니다.");

    let lastHeight = await driver.executeScript(
      "return document.body.scrollHeight"
    );
    let results = [];
    let articles;
    const maxArticles = 10; // 크롤링할 기사의 최대 개수 설정
    const scrollLimit = 5000; // 최대 스크롤 횟수 설정
    let scrollCount = 0;

    while (results.length < maxArticles && scrollCount < scrollLimit) {
      // 스크롤을 제어합니다.
      await driver.executeScript(
        "window.scrollTo(0, document.body.scrollHeight);"
      );
      await driver.sleep(500); // 스크롤 후 약간의 대기 시간

      // 새로 로드된 기사를 찾습니다.
      articles = await driver.findElements(By.css(".list_news .bx"));

      // 새로 로드된 기사를 results 배열에 추가합니다.
      for (let article of articles) {
        let title = await article.findElement(By.css(".news_tit")).getText();
        let link = await article
          .findElement(By.css(".news_tit"))
          .getAttribute("href");

        // 기사 업로드 시간 가져오기
        let timeElements = await article.findElements(By.css("span.info"));
        let time =
          timeElements.length > 1
            ? await timeElements[1].getText()
            : timeElements.length === 1
            ? await timeElements[0].getText()
            : "시간 정보 없음";

        // 시간 정보를 날짜로 변환
        time = convertTimeToDate(time);

        // 기사 요약 정보 가져오기
        let summaryElement = await article
          .findElement(By.css(".news_dsc"))
          .catch(() => null);
        let summary = summaryElement
          ? await summaryElement.getText()
          : "요약 정보 없음";

        // 중복 기사 필터링
        if (!results.some((item) => item.link === link)) {
          results.push({ title, link, time, summary });
        }

        // 크롤링할 기사의 최대 개수에 도달하면 중지
        if (results.length >= maxArticles) {
          break;
        }
      }

      // 스크롤 후 높이를 확인합니다.
      let newHeight = await driver.executeScript(
        "return document.body.scrollHeight"
      );
      if (newHeight === lastHeight) {
        break; // 더 이상 새로운 기사가 없으면 종료합니다.
      }
      console.log("뭐지", results.length);
      lastHeight = newHeight;
      scrollCount++;
    }

    console.log("크롤링한 기사:", results);
    res.json(results);
  } catch (error) {
    console.error("Selenium 작업 중 오류 발생:", error);
    res.status(500).json({ error: error.message });
  } finally {
    // driver.quit() 호출을 주석 처리하여 브라우저가 닫히지 않도록 합니다.
    // if (driver) {
    //   await driver.quit();
    // }
    console.log("브라우저를 닫지 않습니다. (디버깅 모드)");
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
