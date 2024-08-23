import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import moment from "moment";

function App() {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbtkeksej, setDbtkeksdj] = useState([]);
  const [crawledCount, setCrawledCount] = useState(0);
  const maxArticles = 2000; // 크롤링할 기사의 최대 개수 설정
  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {}, [crawledCount]);

  const handleSearchClick = () => {
    axios
      .get(
        `http://localhost:5001/api/news?query=${encodeURIComponent(
          searchQuery
        )}`
      )
      .then((response) => {
        setArticles(response.data);
        setCrawledCount(response.data.length); // 초기 기사 수 설정
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
      });
  };

  const filterArticles = (keyword) => {
    return articles.filter((article) => article.title.includes(keyword));
  };

  const renderArticles = (filteredArticles) => {
    return filteredArticles.map((article, index) => (
      <li key={index}>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: getColorForTitle(article.title) }}
        >
          {article.title}
        </a>
        <p>{convertTimeToDate(article.time)}</p>
        <p>{article.summary}</p>
      </li>
    ));
  };

  const getColorForTitle = (title) => {
    if (title.includes("법")) return "red";
    if (title.includes("법령")) return "blue";
    if (title.includes("정책")) return "green";
    if (title.includes("법안")) return "purple";
    if (title.includes("법률")) return "orange";
    return "black";
  };

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
    } else {
      return time;
    }
  };

  const handleDownloadClick = () => {
    const categories = ["법", "법령", "규제", "법안", "법률"];
    const workbook = XLSX.utils.book_new();

    categories.forEach((category) => {
      const filteredArticles = filterArticles(category);
      const worksheetData = filteredArticles.map((article) => ({
        Title: article.title,
        Link: article.link,
        Time: convertTimeToDate(article.time),
        Summary: article.summary,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // 열 너비 설정
      worksheet["!cols"] = [
        { wch: 30 }, // Title
        { wch: 50 }, // Link
        { wch: 20 }, // Time
        { wch: 50 }, // Summary
      ];

      // 행 높이 설정
      worksheet["!rows"] = filteredArticles.map(() => ({ hpt: 50 }));

      XLSX.utils.book_append_sheet(workbook, worksheet, category);
    });

    const fileName = `${searchQuery}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      <h1>Naver News</h1>{" "}
      <div>
        크롤링 수 : {crawledCount}/{maxArticles}{" "}
      </div>
      <div style={{ marginLeft: `10px` }}>
        <input type="text" value={searchQuery} onChange={handleInputChange} />
        <button onClick={handleSearchClick}>확인</button>
      </div>
      <button onClick={handleDownloadClick}>엑셀 다운로드</button>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>법</h2>
          <ul>{renderArticles(filterArticles("법"))}</ul>
        </div>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>법령</h2>
          <ul>{renderArticles(filterArticles("법령"))}</ul>
        </div>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>규제</h2>
          <ul>{renderArticles(filterArticles("규제"))}</ul>
        </div>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>법안</h2>
          <ul>{renderArticles(filterArticles("법안"))}</ul>
        </div>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>법률</h2>
          <ul>{renderArticles(filterArticles("법률"))}</ul>
        </div>
        <div
          style={{
            flex: "1 1 30%",
            height: "400px",
            overflowY: "scroll",
            border: "1px solid black",
            margin: "10px",
          }}
        >
          <h2>기타</h2>
          <ul>
            {renderArticles(
              articles.filter(
                (article) =>
                  !["법", "법령", "규제", "법안", "법률"].some((keyword) =>
                    article.title.includes(keyword)
                  )
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
