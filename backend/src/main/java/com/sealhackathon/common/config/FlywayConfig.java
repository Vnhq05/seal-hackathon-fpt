package com.sealhackathon.common.config;

import com.zaxxer.hikari.HikariConfigMXBean;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.boot.jdbc.DataSourceUnwrapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Slf4j
@Configuration
public class FlywayConfig {

    /**
     * Flyway migrates on a connection borrowed from the shared Hikari pool. SQL Server session
     * settings a script issues (SET NOCOUNT ON, SET DATEFORMAT, ...) outlive the migration because
     * Hikari does not reset them when the connection goes back to the pool. A connection left with
     * NOCOUNT ON makes SQL Server report updateCount -1 for every later write, which Hibernate reads
     * as "row disappeared" and rethrows as OptimisticLockingFailureException — the app then answers
     * 409 on random requests (login inserting refresh_tokens was the usual victim) until restart.
     * Evicting the pool right after migrate keeps migration session state from leaking into runtime.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            flyway.migrate();
            HikariDataSource hikari = DataSourceUnwrapper.unwrap(
                    dataSource, HikariConfigMXBean.class, HikariDataSource.class);
            if (hikari == null || hikari.getHikariPoolMXBean() == null) {
                return;
            }
            hikari.getHikariPoolMXBean().softEvictConnections();
            log.info("Evicted pooled connections used by Flyway to drop migration session state");
        };
    }
}
