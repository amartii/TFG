FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
COPY demo ./demo
RUN mvn -B -DskipTests package
RUN javac demo/SyntheticTerrain.java && java -cp demo SyntheticTerrain demo/terrain-synthetic.tif

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/gemelo5g-0.1.0-SNAPSHOT.jar /app/app.jar
COPY --from=build /build/demo/00000000-0000-4000-8000-000000000001.json /opt/demo/
COPY --from=build /build/demo/terrain-synthetic.tif /opt/demo/
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
