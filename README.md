<div align="center">

## 📈 Stockpedia

주식 정보를 나누는 커뮤니티, Stockpedia

</div>

- Stockpedia는 관심 종목과 시장 이슈에 대한 정보, 의견을 공유하는 주식 정보 커뮤니티입니다.
- 단순한 CRUD 구현에 머무르지 않고, 실제 운영 환경에서 발생할 수 있는 문제를 해결하는 데 초점을 맞췄습니다.
- DAU 3만, MAU 100만 규모의 트래픽을 가정하고 동시성 문제를 개선하고, 컨테이너 기반 실행 환경 및 배포, Kubernetes 배포, 모니터링을 통한 관측성 확보까지 단계적으로 확장했습니다.

---

### 🎬 시연 영상

▶ _(시연 영상 링크 추가 예정)_

---

### 📌 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [아키텍처](#-아키텍처)
- [DB ERD](#-db-erd)
- [기술 스택](#-기술-스택)
- [폴더 구조](#-폴더-구조)
- [배포](#-배포)
- [기술적 의사결정](#-기술적-의사결정)
- [팀 소개](#-팀-소개)

---

### 🎯 프로젝트 소개

주식 정보 커뮤니티는 특정 종목이나 시장 이슈가 부각될 때 짧은 시간 안에 조회, 댓글, 좋아요 요청이 특정 게시글로 집중되는 특성이 있습니다.
인기 글 하나에 트래픽이 몰리면 조회수 UPDATE가 지속적인 DB 쓰기 부하를 만들고, 같은 게시글의 카운터에 동시 요청이 겹치면서 경쟁 상태(race condition)와 갱신 유실(Lost Update)이 발생할 수 있습니다.
또한 서비스 규모가 커질수록 단일 서버만으로는 트래픽을 안정적으로 처리하기 어렵기 때문에, 운영 환경 역시 확장이 가능한 구조로 전환할 필요가 있습니다.

이 프로젝트는 단순한 기능 구현에 머무르지 않고, 실제 운영 환경에서 발생할 수 있는 문제를 재현하고 근거를 바탕으로 해결하는 데 초점을 맞췄습니다.

1. 동시성, 부하 분리
   조회수는 Redis 카운터에 적재한 뒤 주기적으로 DB에 flush하고, 좋아요, 댓글 수는 벌크 UPDATE를 통해 원자적으로 정합성을 확보했습니다.

2. 다중 인스턴스 대응
   Spring Session + Redis로 세션을 외부화해 여러 애플리케이션 인스턴스가 동일한 로그인 상태를 공유하도록 구성했습니다.

3. 두 갈래 배포 구조  
   단일 VM에서는 Docker Compose로 애플리케이션과 의존 서비스를 컨테이너 기반으로 배포하고, 확장 운영 환경에서는 Kubernetes와 Argo CD를 활용한 GitOps 배포 구조를 구성했습니다.

4. 관측성 확보  
   Actuator와 Micrometer로 애플리케이션 지표를 노출하고 Prometheus에서 이를 수집하도록 구성했습니다. 또한 Loki/Grafana/Alloy 기반 PLG 스택을 구축해 로그와 대시보드를 통해 서비스 상태를 관찰할 수 있도록 했습니다.

이를 통해 애플리케이션 기능 구현을 넘어 Containerization, AWS 인프라, CI/CD, Observability, Kubernetes 운영, GitOps, 데이터베이스 동시성 제어까지 다루며 서비스 개발부터 운영까지의 전체 흐름을 이해하고 구현하는 것을 목표로 진행했습니다.

---

### ✨ 주요 기능

| 구분   | 주요 기능                        | 설명                                                                           |
| ------ | -------------------------------- | ------------------------------------------------------------------------------ |
| 인증   | 로그인 / 로그아웃 / 상태 확인    | 세션 기반 인증(Redis 분산 세션), bcrypt 비밀번호 해싱                          |
| 회원   | 회원 CRUD, 중복 검사             | 회원가입, 조회, 수정, 탈퇴, 이메일, 닉네임 중복 확인, 비밀번호 변경            |
| 게시글 | 작성 / 목록 / 상세 / 수정 / 삭제 | 커서 기반 페이지네이션, 소프트 삭제, QueryDSL 프로젝션 조회                    |
| 댓글   | 조회 / 작성 / 수정 / 삭제        | 게시글별 댓글 관리, 댓글 수 카운터 동기화                                      |
| 좋아요 | 등록 / 취소                      | 원자적 UPDATE로 Lost Update 방지                                               |
| 조회수 | 집계 / 반영                      | Redis 카운터로 집계 후 스케줄러가 MySQL에 flush, 30분 단위 중복 조회 방지      |
| 이미지 | 게시글 / 프로필 이미지           | 이미지를 애플리케이션과 분리해 AWS S3에 저장                                   |
| 관측성 | 지표. 로그, 대시보드             | Actuator, Micrometer → Prometheus, Loki/Grafana/Alloy(PLG)로 로그 수집, 시각화 |

---

### 🏗 아키텍처

![stockpedia_containerization.png](/asset/stockpedia_containerization.png)
![stockpedia_kubernetes.png](/asset/stockpedia_kubernetes.png)
![stockpedia_routing_table.png](/asset/stockpedia_routing_table.png)

---

### 🗂 DB ERD

![stockpedia.png](/asset/stockpedia.png)

---

### 💻 기술 스택

### 🌑 Backend

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?style=flat&logo=springboot&logoColor=white)
![Spring Web MVC](https://img.shields.io/badge/Spring%20Web%20MVC-6DB33F?style=flat&logo=spring&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring%20Data%20JPA-6DB33F?style=flat&logo=spring&logoColor=white)
![Spring Session](https://img.shields.io/badge/Spring%20Session-6DB33F?style=flat&logo=spring&logoColor=white)
![QueryDSL](https://img.shields.io/badge/QueryDSL-5.1-0769AD?style=flat)

### 🌒 Database

![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)

### 🌗 Infra

![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)

### 🌠 Orchestration

![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Helm](https://img.shields.io/badge/Helm-0F1689?style=flat&logo=helm&logoColor=white)
![Argo CD](https://img.shields.io/badge/Argo%20CD-EF7B4D?style=flat&logo=argo&logoColor=white)

### 🌌 Observability

![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-F5A800?style=flat&logo=grafana&logoColor=white)
![Grafana Alloy](https://img.shields.io/badge/Grafana%20Alloy-F46800?style=flat&logo=grafana&logoColor=white)
![Micrometer](https://img.shields.io/badge/Micrometer-117A9E?style=flat)
![Portainer](https://img.shields.io/badge/Portainer-13BEF9?style=flat&logo=portainer&logoColor=white)

### 🌖 CI/CD

![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat&logo=githubactions&logoColor=white)
![Amazon ECR](https://img.shields.io/badge/Amazon%20ECR-FF9900?style=flat&logo=amazonaws&logoColor=white)

### 🌓 Build

![Gradle](https://img.shields.io/badge/Gradle-02303A?style=flat&logo=gradle&logoColor=white)

### 🌔 Tools

![Lombok](https://img.shields.io/badge/Lombok-BC4521?style=flat)
![p6spy](https://img.shields.io/badge/p6spy-4B5563?style=flat)

### 🌟 형상관리

![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)

---

### 📂 폴더 구조

```text
stockpedia-backend/
├── src/main/java/com/ktb/
│   ├── auth/
│   ├── member/
│   ├── post/
│   ├── comment/
│   ├── postlike/
│   ├── postImage/
│   ├── profileImage/
│   ├── file/
│   └── global/
│       ├── auth/
│       ├── redis/
│       ├── s3/
│       ├── querydsl/
│       ├── web/
│       └── utils/
│
├── src/main/resources/
├── kube/argocd/
├── docker-compose.yml
├── Dockerfile
└── .github/workflows/
```

---

### 📦 배포

#### Docker Compose 기반 단일 인스턴스

- 단일 서버 환경에서 컨테이너 기반으로 운영합니다.
- Nginx가 80/443 포트에서 TLS를 종단하고 Certbot으로 인증서를 관리하며, 요청을 애플리케이션 컨테이너로 전달합니다.
- API 인스턴스에는 Portainer Agent만 실행해 원격 Portainer Server에서 컨테이너 상태를 관리할 수 있도록 구성했으며, Docker 네트워크를 통해 서비스망(`app_net`)과 관리망(`management_net`)을 분리했습니다.

#### Kubernetes - Argo CD GitOps

```text
main push
  → GitHub Actions 실행
  → Docker 이미지 빌드
  → ECR 이미지 푸시
  → umbrella-helm/values.yaml 이미지 태그 갱신
  → 변경사항 Git commit
  → Argo CD 변경 감지
  → 운영 배포 안정성을 위해 Argo CD에서 수동 Sync 실행
  → Kubernetes Rolling Update 배포
```

- 가용성: `replicaCount: 2`로 이중화하고, `maxUnavailable: 0`, `maxSurge: 1` 기반의 무중단 Rolling Update와 `startup`, `readiness`, `liveness` probe를 구성했습니다.
- 노출: NodePort와 ALB Ingress로 외부 트래픽을 처리하며, ALB, ACM TLS, `/actuator/health/readiness` 기반 헬스체크를 설정했습니다.
- 엄브렐라 Helm: `backend`, `monitoring`(Prometheus/Loki/Grafana), `portainer`, `cluster` 서브 차트를 하나의 Umbrella Helm 차트로 통합 관리했습니다.

---

### 🧭 기술적 의사결정

<details>
<summary><b>게시글 조회수 증가로 발생하는 DB Write 부하 개선</b></summary>

<br>

### 문제 정의

- 게시글 상세 조회마다 `view_count`를 즉시 UPDATE하는 구조에서는 조회 요청이 늘어날수록 DB 쓰기도 같은 비율로 증가합니다.
- 조회수는 조회 트래픽에 비례해 증가하는 값이기 때문에, 서비스 규모가 커질수록 읽기 요청이 지속적인 쓰기 부하로 이어지는 문제가 발생합니다.

### 요구사항 분석

- 조회수는 게시글 내용이나 좋아요 여부처럼 즉각적인 정합성이 중요한 데이터는 아니라고 판단했습니다.
- 몇 초 늦게 반영되더라도 사용자 경험에 미치는 영향이 작고, 랭킹이나 추천 품질을 결정하는 핵심 quality score로도 사용하지 않았습니다.
- 따라서 조회마다 즉시 DB에 반영하는 대신, 일정 시간 동안 증가분을 모아 한 번에 반영하는 방식을 검토했습니다.

### 해결

- 게시글 조회 시 Redis 카운터(`view:post:{id}`)를 증가시킵니다.
- 동일 사용자의 반복 조회는 30분 TTL을 가진 중복 조회 방지 키(`view:dedup:`)를 `setIfAbsent`로 생성해 걸러냅니다.
- 스케줄러(`@Scheduled(fixedDelay = 30s)`)가 Redis 키를 `SCAN` 하며 각 카운터를 `getAndDelete` 하고, 증가분(delta)을 DB에 반영해 정합성을 맞춥니다.

최종 조회수를 덮어쓰지 않고 증가분을 더하는 방식이므로, 여러 인스턴스에서 발생한 조회 증가분도 DB에서 안전하게 누적됩니다.

### Trade off

- Redis를 버퍼로 사용하는 구조는 DB Write 부하를 줄이는 대신 궁극적 일관성(Eventual Consistency)을 선택하는 방식입니다.
- flush 주기 사이에 애플리케이션이나 Redis 장애가 발생하면, 아직 DB에 반영되지 않은 증가분 일부가 유실될 수 있습니다.
- 다만 조회수는 결제, 재고처럼 강한 정합성이 필요한 데이터가 아니며, 서비스의 핵심 품질 판단 기준으로도 사용하지 않았습니다.
- 따라서 짧은 구간의 일부 조회수 유실은 허용 가능한 범위로 보고, 조회 요청마다 DB UPDATE를 수행하는 구조보다 쓰기 부하를 줄이는 방향을 선택했습니다.
</details>

<details>
<summary><b>좋아요, 댓글 수 정합성: 원자적 UPDATE로 Lost Update 방지</b></summary>

<br>

### 문제 정의

- 빠른 조회를 위해 게시글의 좋아요 수와 댓글 수를 `like_count`, `comment_count` 비정규화 컬럼으로 관리했습니다.
- 하지만 카운터를 갱신할 때 게시글 엔티티를 먼저 조회한 뒤 값을 변경하고, dirty checking으로 저장하는 방식은 동시 요청 상황에서 문제가 발생할 수 있습니다.

- 예를 들어 같은 게시글에 좋아요 요청이 동시에 들어오면 두 트랜잭션이 동일한 `like_count` 값을 읽고 각각 `+1`을 수행한 뒤 저장할 수 있습니다.
- 이 경우 나중에 저장된 값이 먼저 저장된 증가분을 덮어쓰면서 Lost Update가 발생합니다.

### 요구사항 분석

- 좋아요 수와 댓글 수는 조회 성능을 위해 게시글 테이블에 함께 저장했지만, 실제 변경은 여러 사용자의 동시 요청으로 자주 발생할 수 있는 값입니다.
- 따라서 애플리케이션에서 값을 읽고 수정한 뒤 저장하는 방식보다, DB가 현재 값을 기준으로 직접 증가시키는 방식이 더 적합하다고 판단했습니다.

### 해결

- 카운터 갱신은 조회-수정-저장 방식 대신, JPA를 우회해서 DB에서 직접 증가시키는 원자적 UPDATE로 처리했습니다.
- 댓글 수 역시 동일하게 `commentCount = commentCount + 1` 또는 `commentCount = commentCount - 1` 형태의 UPDATE로 처리해, 현재 DB 값을 기준으로 카운터가 변경되도록 했습니다.
- 동시 좋아요, 댓글 요청이 발생해도 각 요청의 증가분이 덮어써지지 않고 DB에서 순차적으로 반영됩니다.
- 이를 통해 `like_count`, `comment_count` 비정규화 컬럼의 조회 성능은 유지하면서도, 카운터 변경 시 발생할 수 있는 Lost Update 문제를 방지했습니다.

</details>

<details>
<summary><b>게시글 조회 성능 개선: DTO Projection으로 N+1 방지</b></summary>

<br>

### 문제 정의

- 게시글 목록과 상세 화면에서는 게시글 정보뿐 아니라 작성자, 프로필 이미지, 좋아요 여부 등 여러 테이블의 데이터를 함께 보여줘야 합니다.
- 이때 연관 엔티티를 지연 로딩으로 하나씩 접근하면, 목록에 비례해 추가 쿼리가 발생하는 N + 1 문제가 생길 수 있습니다.

### Tradeoff

| 방식           | 특징                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Fetch Join     | 연관 엔티티를 함께 조회할 수 있지만, 컬렉션 조인에서는 중복 row가 발생해 페이지네이션이 복잡해질 수 있음 |
| Batch Size     | N+1을 완화할 수 있지만, 조회 화면에 필요하지 않은 엔티티까지 로딩될 수 있음                              |
| DTO Projection | 화면에 필요한 컬럼만 직접 조회하고, 응답 DTO로 바로 매핑할 수 있음                                       |

### 해결

- 조회 전용 화면에서는 엔티티 그래프를 그대로 로딩하지 않고, QueryDSL의 `Projections.constructor`를 사용해 응답 DTO에 필요한 컬럼만 직접 매핑했습니다.
- 이를 통해 게시글 목록과 상세 조회에서 작성자 정보, 프로필 이미지, 좋아요 여부 등 화면에 필요한 데이터만 조회하고, 지연 로딩으로 인한 N+1 문제를 방지했습니다.

### 결과

- 불필요한 엔티티 로딩을 줄이고, 목록 크기에 따라 쿼리 수가 증가하는 문제를 방지했습니다.
- 또한 조회 API의 응답 형태에 맞춰 필요한 데이터만 가져오도록 구성해, 게시글 목록, 상세 조회 성능을 안정적으로 유지할 수 있도록 했습니다.

</details>

---

### 🏠 팀 소개

<table>
  <thead>
    <tr>
      <th style="border: 2px solid black; text-align: center; background-color: #f2f2f2;" colspan="6">Stockpedia</th>
    </tr>
  </thead>
  <tbody>
    <tr align="center">
      <td style="border: 2px solid black;">
        <a href="https://github.com/wsh6922" target="_blank">
          <img src="https://avatars.githubusercontent.com/u/133782100?v=4" width="100px;" alt style="max-width: 100%;">
          <br>
          <sub>김남욱</sub>
      </td>
    </tr>
  </tbody>
</table>

---
